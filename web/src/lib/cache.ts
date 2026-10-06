import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { Chat, ChatPage, Message, MessagePage, Status } from './types'

type Messages = InfiniteData<MessagePage, string | null>
type Chats = InfiniteData<ChatPage, string | null>

export const messagesKey = (chatId: string) => ['messages', chatId] as const

/**
 * Insert or update a message in the chat's cached pages. Pages are newest
 * first; within a page messages are chronological, so new ones go at the end
 * of page 0. `replaceId` swaps an optimistic placeholder for the real message.
 */
export const upsertMessage = (
  qc: QueryClient,
  msg: Partial<Message> & { id: string; chatId: string },
  replaceId?: string,
) => {
  qc.setQueryData<Messages>(messagesKey(msg.chatId), (data) => {
    if (!data) return data
    let found = false
    const pages = data.pages.map((page) => {
      let changed = false
      const messages: Message[] = []
      for (const m of page.messages) {
        if (m.id === msg.id) {
          if (found) {
            changed = true
            continue
          }
          found = true
          changed = true
          messages.push({ ...m, ...msg, localUrl: m.localUrl })
        } else if (replaceId && m.id === replaceId) {
          changed = true
          if (!found) {
            found = true
            messages.push({ ...m, ...msg, localUrl: m.localUrl } as Message)
          }
        } else {
          messages.push(m)
        }
      }
      return changed ? { ...page, messages } : page
    })

    if (!found) {
      // Partial updates (e.g. an ack) for messages we haven't loaded are dropped.
      if (!('timestamp' in msg) || msg.timestamp === undefined) return data
      const first = pages[0]
      // A sent message can arrive over the socket before its POST resolves
      // (slow sends during sync): take over the matching placeholder.
      const placeholder = msg.fromMe
        ? first.messages.find(
            (m) =>
              m.id.startsWith('local_') &&
              m.body === (msg.body ?? '') &&
              m.hasMedia === Boolean(msg.hasMedia) &&
              Math.abs(m.timestamp - msg.timestamp!) < 300,
          )
        : undefined
      const messages = [
        ...first.messages.filter((m) => m !== placeholder),
        { ...msg, localUrl: placeholder?.localUrl } as Message,
      ].sort(
        (a, b) => a.timestamp - b.timestamp,
      )
      pages[0] = { ...first, messages }
    }
    return { ...data, pages }
  })
}

export const removeMessage = (qc: QueryClient, chatId: string, id: string) => {
  qc.setQueryData<Messages>(messagesKey(chatId), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((p) => ({
            ...p,
            messages: p.messages.filter((m) => m.id !== id),
          })),
        }
      : data,
  )
}

const chatOrder = (a: Chat, b: Chat) =>
  Number(b.pinned) - Number(a.pinned) || b.lastMessageAt - a.lastMessageAt

/** Move an updated chat to its sorted spot in every cached chat list. */
export const upsertChat = (qc: QueryClient, chat: Chat) => {
  for (const [key, data] of qc.getQueriesData<Chats>({ queryKey: ['chats'] })) {
    if (!data) continue
    const [, filter, q, archived] = key as [string, string, string, boolean]
    const matches =
      chat.archived === Boolean(archived) &&
      (filter !== 'unread' || chat.unreadCount > 0) &&
      (filter !== 'groups' || chat.isGroup) &&
      (!q || (chat.name || '').toLowerCase().includes(q.toLowerCase()))

    const existedAt = data.pages.findIndex((p) => p.chats.some((c) => c.id === chat.id))
    const pages = data.pages.map((p) => ({
      ...p,
      chats: p.chats.filter((c) => c.id !== chat.id),
    }))
    if (matches) {
      // Keep it on the page it lived on unless it's now newer than page 0's tail.
      const target =
        existedAt > 0 && chatOrder(chat, pages[0].chats.at(-1) ?? chat) > 0 ? existedAt : 0
      pages[target] = {
        ...pages[target],
        chats: [...pages[target].chats, chat].sort(chatOrder),
      }
    }
    qc.setQueryData<Chats>(key, { ...data, pages })
  }
  qc.setQueryData(['chat', chat.id], (old: object | undefined) =>
    old ? { ...old, ...chat } : old,
  )
}

export const removeChat = (qc: QueryClient, id: string) => {
  for (const [key, data] of qc.getQueriesData<Chats>({ queryKey: ['chats'] })) {
    if (!data) continue
    qc.setQueryData<Chats>(key, {
      ...data,
      pages: data.pages.map((p) => ({ ...p, chats: p.chats.filter((c) => c.id !== id) })),
    })
  }
}

export const findChat = (qc: QueryClient, id: string): Chat | undefined => {
  for (const [, data] of qc.getQueriesData<Chats>({ queryKey: ['chats'] })) {
    const hit = data?.pages.flatMap((p) => p.chats).find((c) => c.id === id)
    if (hit) return hit
  }
  return undefined
}

export const setStatus = (qc: QueryClient, status: Status) => qc.setQueryData(['status'], status)
