import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const chats = sqliteTable(
  'chats',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    isGroup: integer('is_group', { mode: 'boolean' }).notNull().default(false),
    unreadCount: integer('unread_count').notNull().default(0),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
    muted: integer('muted', { mode: 'boolean' }).notNull().default(false),
    lastMessageId: text('last_message_id'),
    lastMessageAt: integer('last_message_at').notNull().default(0),
    lastMessagePreview: text('last_message_preview'),
    lastMessageType: text('last_message_type'),
    lastMessageFromMe: integer('last_message_from_me', { mode: 'boolean' }),
    lastMessageAck: integer('last_message_ack'),
    // Set once older history has been exhausted on WhatsApp's side.
    historyComplete: integer('history_complete', { mode: 'boolean' })
      .notNull()
      .default(false),
  },
  (t) => ({
    byLastMessage: index('chats_last_message_idx').on(
      t.archived,
      t.pinned,
      t.lastMessageAt,
    ),
  }),
);

export const messages = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(),
    chatId: text('chat_id').notNull(),
    fromMe: integer('from_me', { mode: 'boolean' }).notNull(),
    author: text('author'),
    authorName: text('author_name'),
    body: text('body').notNull().default(''),
    type: text('type').notNull(),
    timestamp: integer('timestamp').notNull(),
    ack: integer('ack').notNull().default(0),
    hasMedia: integer('has_media', { mode: 'boolean' })
      .notNull()
      .default(false),
    mediaMime: text('media_mime'),
    mediaFilename: text('media_filename'),
    mediaPath: text('media_path'),
    duration: integer('duration'),
    quotedId: text('quoted_id'),
    quotedBody: text('quoted_body'),
    quotedAuthor: text('quoted_author'),
    isForwarded: integer('is_forwarded', { mode: 'boolean' })
      .notNull()
      .default(false),
    revoked: integer('revoked', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => ({
    byChatTime: index('messages_chat_time_idx').on(t.chatId, t.timestamp),
  }),
);

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name'),
  pushname: text('pushname'),
  number: text('number'),
  isMyContact: integer('is_my_contact', { mode: 'boolean' })
    .notNull()
    .default(false),
});

export type ChatRow = typeof chats.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type NewMessageRow = typeof messages.$inferInsert;
