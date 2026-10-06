export type BotStatus =
  | 'initializing'
  | 'qr'
  | 'authenticated'
  | 'ready'
  | 'disconnected'

export interface Status {
  status: BotStatus
  name: string | null
  qr?: string
  syncing?: boolean
}

export interface Chat {
  id: string
  name: string | null
  isGroup: boolean
  unreadCount: number
  archived: boolean
  pinned: boolean
  muted: boolean
  lastMessageId: string | null
  lastMessageAt: number
  lastMessagePreview: string | null
  lastMessageType: string | null
  lastMessageFromMe: boolean | null
  lastMessageAck: number | null
  historyComplete: boolean
  sendRestriction: 'admins' | 'not_participant' | 'community' | null
}

export interface Message {
  id: string
  chatId: string
  fromMe: boolean
  author: string | null
  authorName: string | null
  body: string
  type: string
  timestamp: number
  /** -1 = pending (optimistic), 0 error/clock, 1 sent, 2 delivered, 3 read, 4 played */
  ack: number
  hasMedia: boolean
  mediaMime: string | null
  mediaFilename: string | null
  duration: number | null
  quotedId: string | null
  quotedBody: string | null
  quotedAuthor: string | null
  isForwarded: boolean
  revoked: boolean
  /** Client-only: object URL for optimistic media previews. */
  localUrl?: string
  failed?: boolean
}

export interface Participant {
  id: string
  number: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

export interface Contact {
  id: string
  name: string | null
  pushname: string | null
  number: string | null
}

export interface SearchResult {
  id: string
  chatId: string
  chatName: string | null
  isGroup: boolean
  fromMe: boolean
  authorName: string | null
  body: string
  type: string
  timestamp: number
  snippet: string
}

export interface ChatPage {
  chats: Chat[]
  nextCursor: string | null
}

export interface MessagePage {
  messages: Message[]
  nextCursor: string | null
  /** Size of the page as fetched; realtime appends don't change it. */
  baseCount?: number
}

export type ChatFilter = 'all' | 'unread' | 'groups' | 'channels'
