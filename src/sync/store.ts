import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { chats, contacts, messages, type NewMessageRow } from '../db/schema';
import { previewOf, toChatRow } from './mappers';

type ChatInput = ReturnType<typeof toChatRow>;

export const upsertMessages = (rows: NewMessageRow[]): void => {
  if (rows.length === 0) return;
  db.transaction((tx) => {
    for (const row of rows) {
      tx.insert(messages)
        .values(row)
        .onConflictDoUpdate({
          target: messages.id,
          // Keep mediaPath: it's filled lazily on download, never by WhatsApp.
          set: {
            body: row.body,
            type: row.type,
            ack: sql`max(${messages.ack}, ${row.ack ?? 0})`,
            revoked: row.revoked ?? false,
            hasMedia: row.hasMedia ?? false,
            mediaMime: sql`coalesce(${row.mediaMime ?? null}, ${
              messages.mediaMime
            })`,
            mediaFilename: sql`coalesce(${row.mediaFilename ?? null}, ${
              messages.mediaFilename
            })`,
          },
        })
        .run();
    }
  });
};

export const upsertChats = (rows: ChatInput[]): void => {
  if (rows.length === 0) return;
  db.transaction((tx) => {
    for (const row of rows) {
      tx.insert(chats)
        .values(row)
        .onConflictDoUpdate({
          target: chats.id,
          set: {
            name: sql`coalesce(${row.name}, ${chats.name})`,
            isGroup: row.isGroup,
            unreadCount: row.unreadCount,
            archived: row.archived,
            pinned: row.pinned,
            muted: row.muted,
            lastMessageAt: sql`max(${chats.lastMessageAt}, ${row.lastMessageAt})`,
          },
        })
        .run();
    }
  });
};

export const upsertContacts = (
  rows: (typeof contacts.$inferInsert)[],
): void => {
  if (rows.length === 0) return;
  db.transaction((tx) => {
    for (const row of rows) {
      tx.insert(contacts)
        .values(row)
        .onConflictDoUpdate({ target: contacts.id, set: row })
        .run();
    }
  });
};

/** Point the chat's denormalized "last message" at row if it's the newest. */
export const touchChat = (row: NewMessageRow): boolean => {
  const preview = previewOf(row);
  const inserted = db
    .insert(chats)
    .values({
      id: row.chatId,
      isGroup: row.chatId.endsWith('@g.us'),
      lastMessageId: row.id,
      lastMessageAt: row.timestamp,
      lastMessagePreview: preview,
      lastMessageType: row.type,
      lastMessageFromMe: row.fromMe,
      lastMessageAck: row.ack ?? 0,
    })
    .onConflictDoNothing()
    .run();
  if (inserted.changes > 0) return true;

  const updated = db
    .update(chats)
    .set({
      lastMessageId: row.id,
      lastMessageAt: row.timestamp,
      lastMessagePreview: preview,
      lastMessageType: row.type,
      lastMessageFromMe: row.fromMe,
      lastMessageAck: row.ack ?? 0,
    })
    .where(
      and(
        eq(chats.id, row.chatId),
        sql`(${chats.lastMessageId} = ${row.id} OR ${chats.lastMessageAt} <= ${row.timestamp})`,
      ),
    )
    .run();
  return updated.changes > 0;
};

/**
 * Recompute last-message fields from stored messages (after backfill/revoke).
 * Unconditional: WhatsApp's chat timestamp can be ahead of its last message.
 */
export const refreshChatLastMessage = (chatId: string): void => {
  const last = db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(sql`${messages.timestamp} desc, rowid desc`)
    .limit(1)
    .get();
  if (!last) return;
  db.update(chats)
    .set({
      lastMessageId: last.id,
      lastMessageAt: sql`max(${chats.lastMessageAt}, ${last.timestamp})`,
      lastMessagePreview: previewOf(last),
      lastMessageType: last.type,
      lastMessageFromMe: last.fromMe,
      lastMessageAck: last.ack,
    })
    .where(eq(chats.id, chatId))
    .run();
};

export const getChat = (id: string) =>
  db.select().from(chats).where(eq(chats.id, id)).get();

export const getMessage = (id: string) =>
  db.select().from(messages).where(eq(messages.id, id)).get();

/** API/realtime shape: never leak server filesystem paths. */
export const toPublicMessage = <T extends { mediaPath?: string | null }>(
  row: T,
): Omit<T, 'mediaPath'> => {
  const { mediaPath: _omit, ...rest } = row;
  return rest;
};

export const getPublicMessage = (id: string) => {
  const row = getMessage(id);
  return row ? toPublicMessage(row) : undefined;
};

export const countMessages = (chatId: string): number =>
  db
    .select({ n: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .get()?.n ?? 0;
