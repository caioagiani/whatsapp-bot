import type { Chat, Client, Contact, Message } from 'whatsapp-web.js';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { chats, messages } from '../db/schema';
import { broadcast } from '../realtime/ws';
import { botState } from '../api/state';
import { chatIdOf, isIgnorable, toChatRow, toMessageRow } from './mappers';
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

const onMessage = (client: Client) => (m: Message) => {
  if (isIgnorable(m)) return;
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
  const id = m.id._serialized;
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
  const id = after.id._serialized;
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
  const id = m.id._serialized;
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

export const backfill = async (client: Client): Promise<void> => {
  const started = Date.now();
  broadcast('sync', { state: 'started' });

  try {
    const all = (await client.getChats()) as Chat[];
    upsertChats(all.map(toChatRow));

    const recent = [...all]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, BACKFILL_CHATS);

    // Sequential on purpose: each fetch round-trips through Puppeteer.
    for (const chat of recent) {
      try {
        const msgs = await chat.fetchMessages({ limit: BACKFILL_MESSAGES });
        upsertMessages(msgs.filter((m) => !isIgnorable(m)).map(toMessageRow));
        refreshChatLastMessage(chat.id._serialized);
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
    upsertMessages(msgs.filter((m) => !isIgnorable(m)).map(toMessageRow));
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
