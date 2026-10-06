import { Router } from 'express';
import multer from 'multer';
import { and, eq, sql } from 'drizzle-orm';
import type { GroupChat, MessageSendOptions } from 'whatsapp-web.js';
import { client, MessageMedia } from '../../services/whatsapp';
import { getAvatarFile, saveMedia, toVoiceNote } from '../../services/media';
import { db } from '../../db';
import { chats, messages } from '../../db/schema';
import {
  getChat,
  getPublicMessage,
  toPublicMessage,
  touchChat,
  upsertMessages,
} from '../../sync/store';
import { isIgnorable, toMessageRow } from '../../sync/mappers';
import { loadOlder } from '../../sync';
import { broadcast } from '../../realtime/ws';
import { botState } from '../state';
import { decodeCursor, encodeCursor, parseLimit } from '../utils/cursor';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 64 * 1024 * 1024 },
});

const ensureReady = (res: import('express').Response): boolean => {
  if (botState.status === 'ready') return true;
  res.status(503).json({ error: 'Bot not ready', status: botState.status });
  return false;
};

const toChatId = (id: string) => (id.includes('@') ? id : `${id}@c.us`);

/**
 * GET /api/chats — keyset-paginated chat list, newest first, pinned on top.
 * Served from SQLite, so it works (read-only) even while WhatsApp is offline.
 */
router.get('/', (req, res) => {
  const limit = parseLimit(req.query.limit, 30);
  const archived = req.query.archived === '1';
  const q = String(req.query.q || '').trim();
  const cursor = decodeCursor<[number, number, string]>(req.query.cursor, 3);

  const filter = String(req.query.filter || 'all');

  const where = [eq(chats.archived, archived)];
  if (filter === 'unread') where.push(sql`${chats.unreadCount} > 0`);
  if (filter === 'groups') where.push(eq(chats.isGroup, true));
  if (q) where.push(sql`${chats.name} LIKE ${`%${q}%`} COLLATE NOCASE`);
  if (cursor) {
    where.push(
      sql`(${chats.pinned}, ${chats.lastMessageAt}, ${chats.id}) < (${cursor[0]}, ${cursor[1]}, ${cursor[2]})`,
    );
  }

  const rows = db
    .select()
    .from(chats)
    .where(and(...where))
    .orderBy(
      sql`${chats.pinned} desc, ${chats.lastMessageAt} desc, ${chats.id} desc`,
    )
    .limit(limit + 1)
    .all();

  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  res.json({
    chats: page,
    nextCursor:
      rows.length > limit && last
        ? encodeCursor([last.pinned ? 1 : 0, last.lastMessageAt, last.id])
        : null,
  });
});

router.get('/:id', async (req, res) => {
  const chat = getChat(req.params.id);
  if (!chat) {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }

  let participants: unknown[] | undefined;
  if (chat.isGroup && botState.status === 'ready') {
    try {
      const group = (await client.getChatById(chat.id)) as GroupChat;
      participants = group.participants?.map((p) => ({
        id: p.id._serialized,
        number: p.id.user,
        isAdmin: p.isAdmin,
        isSuperAdmin: p.isSuperAdmin,
      }));
    } catch {
      participants = undefined;
    }
  }

  res.json({ ...chat, participants });
});

/**
 * GET /api/chats/:id/messages?before=<cursor>&limit=50
 * Returns a page in chronological order plus a cursor for the older page.
 * When the store runs dry it pulls older history from WhatsApp on demand.
 */
router.get('/:id/messages', async (req, res) => {
  const chatId = req.params.id;
  const limit = parseLimit(req.query.limit, 50);
  const cursor = decodeCursor<[number, number]>(req.query.before, 2);

  const query = () =>
    db
      .select({ row: messages, rowid: sql<number>`messages.rowid` })
      .from(messages)
      .where(
        cursor
          ? sql`${messages.chatId} = ${chatId} AND (${messages.timestamp}, messages.rowid) < (${cursor[0]}, ${cursor[1]})`
          : eq(messages.chatId, chatId),
      )
      .orderBy(sql`${messages.timestamp} desc, messages.rowid desc`)
      .limit(limit + 1)
      .all();

  let rows = query();
  const chat = getChat(chatId);
  if (
    rows.length <= limit &&
    chat &&
    !chat.historyComplete &&
    botState.status === 'ready'
  ) {
    try {
      const added = await loadOlder(client, chatId, limit * 2);
      if (added > 0) rows = query();
    } catch (error) {
      console.error(`Failed to load older messages for ${chatId}:`, error);
    }
  }

  const page = rows.slice(0, limit);
  const oldest = page[page.length - 1];
  const hasMore = rows.length > limit || !getChat(chatId)?.historyComplete;

  res.json({
    messages: page.map((r) => toPublicMessage(r.row)).reverse(),
    nextCursor:
      hasMore && oldest
        ? encodeCursor([oldest.row.timestamp, oldest.rowid])
        : null,
  });
});

/**
 * POST /api/chats/:id/messages (JSON or multipart)
 * Fields: text, quotedId, voice=1 (send audio as voice note), file.
 */
router.post('/:id/messages', upload.single('file'), async (req, res) => {
  if (!ensureReady(res)) return;

  const chatId = toChatId(req.params.id);
  const {
    text = '',
    quotedId,
    voice,
  } = req.body as {
    text?: string;
    quotedId?: string;
    voice?: string;
  };
  const file = req.file;

  if (!file && !text.trim()) {
    res.status(400).json({ error: 'Provide text and/or file' });
    return;
  }

  try {
    const options: MessageSendOptions = {};
    if (quotedId) options.quotedMessageId = quotedId;

    let content: string | InstanceType<typeof MessageMedia> = text;
    let mediaBuffer: Buffer | undefined;
    let mediaMime: string | undefined;

    if (file) {
      const asVoice = voice === '1' || voice === 'true';
      mediaBuffer = asVoice
        ? await toVoiceNote(file.buffer, file.mimetype)
        : file.buffer;
      mediaMime = asVoice ? 'audio/ogg; codecs=opus' : file.mimetype;
      content = new MessageMedia(
        mediaMime,
        mediaBuffer.toString('base64'),
        asVoice ? undefined : file.originalname,
      );
      if (asVoice) options.sendAudioAsVoice = true;
      else if (text.trim()) options.caption = text;
      if (
        !asVoice &&
        !file.mimetype.startsWith('image/') &&
        !file.mimetype.startsWith('video/')
      ) {
        options.sendMediaAsDocument = true;
      }
    }

    const sent = await client.sendMessage(chatId, content, options);
    if (isIgnorable(sent)) {
      res.json({ success: true });
      return;
    }

    const row = toMessageRow(sent);
    if (mediaBuffer && mediaMime) {
      row.hasMedia = true;
      row.mediaMime = mediaMime;
      row.mediaFilename = options.sendAudioAsVoice
        ? null
        : file?.originalname || null;
      row.mediaPath = saveMedia(row.id, mediaMime, mediaBuffer);
    }
    upsertMessages([row]);
    if (row.mediaPath) {
      db.update(messages)
        .set({ mediaPath: row.mediaPath })
        .where(eq(messages.id, row.id))
        .run();
    }
    touchChat(row);

    const stored = getPublicMessage(row.id);
    broadcast('message.update', stored);
    const chat = getChat(chatId);
    if (chat) broadcast('chat.update', chat);
    res.status(201).json({ message: stored });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/:id/seen', async (req, res) => {
  const chatId = req.params.id;
  db.update(chats).set({ unreadCount: 0 }).where(eq(chats.id, chatId)).run();
  const chat = getChat(chatId);
  if (chat) broadcast('chat.update', chat);

  if (botState.status === 'ready') {
    client
      .sendSeen(chatId)
      .catch((error) => console.error(`sendSeen failed for ${chatId}:`, error));
  }
  res.json({ success: true });
});

router.post('/:id/presence', async (req, res) => {
  if (!ensureReady(res)) return;
  const state = String(req.body?.state || 'typing');
  try {
    const chat = await client.getChatById(req.params.id);
    if (state === 'recording') await chat.sendStateRecording();
    else if (state === 'stop') await chat.clearState();
    else await chat.sendStateTyping();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update presence' });
  }
});

router.get('/:id/avatar', async (req, res) => {
  if (botState.status !== 'ready') {
    res.status(404).end();
    return;
  }
  try {
    const path = await getAvatarFile(req.params.id);
    if (!path) {
      res.set('Cache-Control', 'public, max-age=3600').status(404).end();
      return;
    }
    res.set('Cache-Control', 'public, max-age=3600');
    res.sendFile(path);
  } catch {
    res.status(404).end();
  }
});

export default router;
