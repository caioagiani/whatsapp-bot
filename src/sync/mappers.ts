import type { Chat, Message } from 'whatsapp-web.js';
import type { NewMessageRow } from '../db/schema';

// Internal WhatsApp bookkeeping that never shows up in a conversation.
export const IGNORED_TYPES = new Set([
  'e2e_notification',
  'notification_template',
  'protocol',
  'ciphertext',
  'unknown',
  'debug',
]);

const serialized = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  // WhatsApp Web renamed `_serialized` to `$1` in its 2026-07 build.
  const v = value as { _serialized?: string; $1?: string };
  return v._serialized || v.$1 || null;
};

type RawData = {
  notifyName?: string;
  mimetype?: string;
  filename?: string;
  duration?: string | number;
  quotedStanzaID?: string;
  quotedParticipant?: unknown;
  quotedMsg?: { body?: string; caption?: string; type?: string };
};

const raw = (m: Message): RawData =>
  ((m as unknown as { _data?: RawData })._data || {}) as RawData;

type RawKey = {
  _serialized?: string;
  $1?: string;
  fromMe?: boolean;
  remote?: unknown;
  id?: string;
  participant?: unknown;
};

/**
 * Serialized message id. Current WhatsApp Web builds sometimes drop
 * `_serialized` from message keys, so rebuild it from its parts
 * (`fromMe_remote_id[_participant]`, same format WhatsApp uses).
 */
export const messageIdOf = (m: Message): string | null => {
  const key = m.id as unknown as RawKey | undefined;
  if (!key) return null;
  const direct = key._serialized || key.$1;
  if (direct) return canonicalMessageId(direct);
  const remote = serialized(key.remote);
  if (!remote || !key.id) return null;
  const participant = serialized(key.participant);
  return `${Boolean(key.fromMe)}_${remote}_${key.id}${
    participant ? `_${participant}` : ''
  }`;
};

/**
 * Newer builds append a direction marker (`_out`) to `$1` for messages we
 * send, while history fetches return the plain key. Store the plain form so
 * both paths land on the same row.
 */
export const canonicalMessageId = (id: string): string =>
  id.replace(/_(out|in)$/, '');

export const chatIdOf = (m: Message): string =>
  serialized((m.id as unknown as { remote?: unknown }).remote) ||
  (m.fromMe ? m.to : m.from);

export const isIgnorable = (m: Message): boolean =>
  IGNORED_TYPES.has(m.type) || chatIdOf(m) === 'status@broadcast';

export const toMessageRow = (m: Message): NewMessageRow => {
  const data = raw(m);
  const chatId = chatIdOf(m);
  return {
    id: messageIdOf(m) as string,
    chatId,
    fromMe: m.fromMe,
    author: m.author || (m.fromMe ? null : m.from),
    authorName: m.fromMe ? null : data.notifyName || null,
    body: m.body || '',
    type: m.type,
    timestamp: m.timestamp,
    ack: m.ack ?? 0,
    hasMedia: m.hasMedia,
    mediaMime: data.mimetype || null,
    mediaFilename: data.filename || null,
    duration: data.duration ? Number(data.duration) || null : null,
    // Bare stanza id; the full serialized id of the quoted message isn't exposed.
    quotedId: data.quotedStanzaID || null,
    quotedBody: data.quotedMsg
      ? data.quotedMsg.body || data.quotedMsg.caption || null
      : null,
    quotedAuthor: serialized(data.quotedParticipant),
    isForwarded: Boolean(m.isForwarded),
    revoked: m.type === 'revoked',
  };
};

const MEDIA_LABEL: Record<string, string> = {
  image: '📷 Foto',
  video: '🎥 Vídeo',
  ptt: '🎤 Mensagem de voz',
  audio: '🎵 Áudio',
  sticker: '💟 Figurinha',
  location: '📍 Localização',
  vcard: '👤 Contato',
  multi_vcard: '👥 Contatos',
  revoked: '🚫 Mensagem apagada',
  call_log: '📞 Chamada',
  poll_creation: '📊 Enquete',
};

export const previewOf = (row: NewMessageRow): string => {
  if (row.revoked) return MEDIA_LABEL.revoked;
  if (row.type === 'document') return `📄 ${row.mediaFilename || 'Documento'}`;
  const label = MEDIA_LABEL[row.type];
  if (label && row.body && ['image', 'video'].includes(row.type)) {
    return `${label.split(' ')[0]} ${row.body}`;
  }
  return label || row.body || '';
};

export interface ChatInput {
  id: string;
  name: string | null;
  isGroup: boolean;
  unreadCount: number;
  archived: boolean;
  pinned: boolean;
  muted: boolean;
  lastMessageAt: number;
  sendRestriction?: string | null;
}

export const toChatRow = (c: Chat): ChatInput => ({
  id: c.id._serialized,
  name: c.name || null,
  isGroup: c.isGroup,
  unreadCount: Math.max(0, c.unreadCount || 0),
  archived: Boolean(c.archived),
  pinned: Boolean(c.pinned),
  muted: Boolean(c.isMuted),
  lastMessageAt: c.timestamp || 0,
  // Only set when read from our own page serializer; undefined keeps the stored value.
  sendRestriction: (c as Chat & { sendRestriction?: string | null })
    .sendRestriction,
});
