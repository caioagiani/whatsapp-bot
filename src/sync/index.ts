import type { Chat, Client, Contact, Message } from 'whatsapp-web.js';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { chats, messages } from '../db/schema';
import { broadcast } from '../realtime/ws';
import { botState } from '../api/state';
import {
  chatIdOf,
  isIgnorable,
  messageIdOf,
  toChatRow,
  toMessageRow,
} from './mappers';
import {
  countMessages,
  getChat,
  getMessage,
  getPublicMessage,
  refreshChatLastMessage,
  touchChat,
  upsertChats,
  upsertContacts,
  upsertMessages,
} from './store';

const BACKFILL_CHATS = Number(process.env.SYNC_BACKFILL_CHATS) || 30;
const BACKFILL_MESSAGES = Number(process.env.SYNC_BACKFILL_MESSAGES) || 50;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ChatFactory = require('whatsapp-web.js/src/factories/ChatFactory');

/**
 * client.getChats() serializes every chat inside one Promise.all, so a single
 * broken chat (left group, stale metadata) rejects the whole list. Serialize
 * each chat on its own and skip the ones that fail.
 */
export const getChatsSafe = async (client: Client): Promise<Chat[]> => {
  const page = (client as unknown as { pupPage: import('puppeteer').Page })
    .pupPage;
  const result = (await page.evaluate(async () => {
    const w = window as unknown as {
      require: (m: string) => any;
      WWebJS: { getChatModel: (c: unknown) => Promise<unknown> };
    };
    const models = w.require('WAWebCollections').Chat.getModelsArray();
    const ok: unknown[] = [];
    const failed: { id: string; error: string }[] = [];
    for (const chat of models) {
      try {
        ok.push(await w.WWebJS.getChatModel(chat));
      } catch (e) {
        // getChatModel resolves the last message via chat.lastReceivedKey,
        // whose _serialized is missing on current WhatsApp Web builds. Fall
        // back to the plain chat fields, which is all the sync needs.
        try {
          const model = chat.serialize();
          model.isGroup = Boolean(chat.groupMetadata);
          model.isMuted = chat.mute?.expiration !== 0;
          model.formattedTitle = chat.formattedTitle;
          model.lastMessage = null;
          delete model.msgs;
          delete model.msgUnsyncedButtonReplyMsgs;
          delete model.unsyncedButtonReplies;
          ok.push(model);
        } catch {
          failed.push({
            id: chat?.id?._serialized,
            error: String((e as Error)?.message || e),
          });
        }
      }
    }
    return { ok, failed };
  })) as { ok: unknown[]; failed: { id: string; error: string }[] };

  if (result.failed.length) {
    console.warn(
      `Sync: skipped ${result.failed.length} chats that failed to load:`,
      result.failed.slice(0, 5),
    );
  }
  return result.ok.filter(Boolean).map((c) => ChatFactory.create(client, c));
};

const emitChat = (chatId: string): void => {
  const chat = getChat(chatId);
  if (chat) broadcast('chat.update', chat);
};

// Chats born from an incoming message only have an id; fetch the rest once.
const hydrating = new Set<string>();
const hydrateChat = async (client: Client, chatId: string): Promise<void> => {
  if (hydrating.has(chatId)) return;
  hydrating.add(chatId);
  try {
    const chat = await client.getChatById(chatId);
    upsertChats([toChatRow(chat)]);
    emitChat(chatId);
  } catch (error) {
    console.error(`Failed to hydrate chat ${chatId}:`, error);
  } finally {
    hydrating.delete(chatId);
  }
};

const toRows = (msgs: Message[]) =>
  msgs.filter((m) => !isIgnorable(m) && messageIdOf(m)).map(toMessageRow);

const onMessage = (client: Client) => (m: Message) => {
  if (isIgnorable(m) || !messageIdOf(m)) return;
  const row = toMessageRow(m);
  const existed = Boolean(getMessage(row.id));
  upsertMessages([row]);

  const isNewChat = !getChat(row.chatId);
  touchChat(row);
  if (!existed && !row.fromMe) {
    db.update(chats)
      .set({ unreadCount: sql`${chats.unreadCount} + 1` })
      .where(eq(chats.id, row.chatId))
      .run();
  }
  if (isNewChat || !getChat(row.chatId)?.name)
    void hydrateChat(client, row.chatId);

  broadcast(
    existed ? 'message.update' : 'message.new',
    getPublicMessage(row.id),
  );
  emitChat(row.chatId);
};

const onAck = (m: Message, ack: number) => {
  const id = messageIdOf(m);
  if (!id) return;
  db.update(messages)
    .set({ ack: sql`max(${messages.ack}, ${ack})` })
    .where(eq(messages.id, id))
    .run();
  const chatId = chatIdOf(m);
  db.update(chats)
    .set({ lastMessageAck: ack })
    .where(sql`${chats.id} = ${chatId} AND ${chats.lastMessageId} = ${id}`)
    .run();
  broadcast('message.update', { id, chatId, ack });
};

const onRevoke = (after: Message) => {
  const id = messageIdOf(after);
  if (!id) return;
  db.update(messages)
    .set({ revoked: true, type: 'revoked', body: '' })
    .where(eq(messages.id, id))
    .run();
  const row = getPublicMessage(id);
  if (!row) return;
  refreshChatLastMessage(row.chatId);
  broadcast('message.update', row);
  emitChat(row.chatId);
};

const onEdit = (m: Message, newBody: string | unknown) => {
  const id = messageIdOf(m);
  if (!id) return;
  db.update(messages)
    .set({ body: String(newBody ?? m.body ?? '') })
    .where(eq(messages.id, id))
    .run();
  const row = getPublicMessage(id);
  if (row) broadcast('message.update', row);
};

const syncContacts = async (client: Client): Promise<void> => {
  const list = (await client.getContacts()) as Contact[];
  upsertContacts(
    list
      .filter((c) => !c.isGroup && c.id?._serialized)
      .map((c) => ({
        id: c.id._serialized,
        name: c.name || null,
        pushname: c.pushname || null,
        number: c.number || null,
        isMyContact: Boolean(c.isMyContact),
      })),
  );
};

// Right after `ready` WhatsApp Web may still be loading its stores.
const withRetry = async <T>(fn: () => Promise<T>, tries = 4): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= tries) throw error;
      await new Promise((r) => setTimeout(r, attempt * 3000));
    }
  }
};

export const backfill = async (client: Client): Promise<void> => {
  const started = Date.now();
  botState.syncing = true;
  broadcast('sync', { state: 'started' });

  try {
    const all = await withRetry(() => getChatsSafe(client));
    upsertChats(all.map(toChatRow));

    const recent = [...all]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, BACKFILL_CHATS);

    // Sequential on purpose: each fetch round-trips through Puppeteer.
    for (const chat of recent) {
      try {
        const msgs = await chat.fetchMessages({ limit: BACKFILL_MESSAGES });
        upsertMessages(toRows(msgs));
        refreshChatLastMessage(chat.id._serialized);
        broadcast('chat.update', getChat(chat.id._serialized));
      } catch (error) {
        console.error(`Backfill failed for ${chat.id._serialized}:`, error);
      }
    }

    await syncContacts(client).catch((error) =>
      console.error('Contact sync failed:', error),
    );

    console.log(
      `Sync: ${all.length} chats, ${recent.length} backfilled in ${
        Date.now() - started
      }ms`,
    );
  } catch (error) {
    console.error('Backfill failed:', error);
  } finally {
    botState.syncing = false;
    broadcast('sync', { state: 'done' });
  }
};

/**
 * Pull older history for a chat from WhatsApp when the local store runs out.
 * fetchMessages only returns the newest N, so ask for what we have + `more`.
 */
const loadingOlder = new Map<string, Promise<number>>();
export const loadOlder = (
  client: Client,
  chatId: string,
  more: number,
): Promise<number> => {
  const pending = loadingOlder.get(chatId);
  if (pending) return pending;

  const job = (async () => {
    const have = countMessages(chatId);
    const chat = await client.getChatById(chatId);
    const wanted = have + more;
    const msgs = await chat.fetchMessages({ limit: wanted });
    upsertMessages(toRows(msgs));
    const added = countMessages(chatId) - have;
    if (msgs.length < wanted || added === 0) {
      db.update(chats)
        .set({ historyComplete: true })
        .where(eq(chats.id, chatId))
        .run();
    }
    return added;
  })().finally(() => loadingOlder.delete(chatId));

  loadingOlder.set(chatId, job);
  return job;
};

export const attachSync = (client: Client): void => {
  const status = () =>
    broadcast('status', {
      status: botState.status,
      name: botState.botName,
      qr: botState.status === 'qr' ? botState.qr : undefined,
    });

  client.on('qr', status);
  client.on('authenticated', status);
  client.on('auth_failure', status);
  client.on('disconnected', status);
  client.on('ready', () => {
    status();
    void backfill(client);
  });

  client.on('message_create', onMessage(client));
  client.on('message_ack', onAck);
  client.on('message_revoke_everyone', onRevoke);
  client.on('message_edit', onEdit);

  client.on('unread_count', (chat: Chat) => {
    db.update(chats)
      .set({ unreadCount: Math.max(0, chat.unreadCount || 0) })
      .where(eq(chats.id, chat.id._serialized))
      .run();
    emitChat(chat.id._serialized);
  });

  client.on('chat_archived', (chat: Chat, archived: boolean) => {
    db.update(chats)
      .set({ archived })
      .where(eq(chats.id, chat.id._serialized))
      .run();
    emitChat(chat.id._serialized);
  });

  client.on('chat_removed', (chat: Chat) => {
    const id = chat.id._serialized;
    db.delete(messages).where(eq(messages.chatId, id)).run();
    db.delete(chats).where(eq(chats.id, id)).run();
    broadcast('chat.remove', { id });
  });
};
