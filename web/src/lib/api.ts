import type {
  Chat,
  ChatFilter,
  ChatPage,
  Contact,
  Message,
  MessagePage,
  Participant,
  SearchResult,
  Status,
} from './types'

const KEY_STORAGE = 'wa.apiKey'

export const getApiKey = (): string => {
  try {
    return localStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

const setApiKey = (key: string) => {
  try {
    localStorage.setItem(KEY_STORAGE, key)
  } catch {
    /* storage unavailable: key lives for this request only */
  }
}

/** Appends ?key= when API_KEY is configured, so <img>/<audio> can load. */
export const withKey = (url: string): string => {
  const key = getApiKey()
  if (!key) return url
  return `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const res = await fetch(withKey(path), init)
  if (res.status === 401 && !retried) {
    const key = window.prompt('Informe a API_KEY do bot')
    if (key) {
      setApiKey(key.trim())
      return request(path, init, true)
    }
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error || res.statusText)
  }
  return res.json()
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
})

const qs = (params: Record<string, string | number | undefined | null>) => {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') s.set(k, String(v))
  }
  const str = s.toString()
  return str ? `?${str}` : ''
}

export const api = {
  status: () => request<Status>('/api/status'),

  chats: (p: { cursor?: string | null; q?: string; filter?: ChatFilter; archived?: boolean }) =>
    request<ChatPage>(
      `/api/chats${qs({
        cursor: p.cursor,
        q: p.q,
        filter: p.filter === 'all' ? undefined : p.filter,
        archived: p.archived ? 1 : undefined,
        limit: 40,
      })}`,
    ),

  chat: (id: string) =>
    request<Chat & { participants?: Participant[] }>(`/api/chats/${encodeURIComponent(id)}`),

  messages: (chatId: string, before?: string | null) =>
    request<MessagePage>(
      `/api/chats/${encodeURIComponent(chatId)}/messages${qs({ before, limit: 50 })}`,
    ),

  send: (
    chatId: string,
    p: { text?: string; quotedId?: string; file?: Blob; filename?: string; voice?: boolean },
  ) => {
    const url = `/api/chats/${encodeURIComponent(chatId)}/messages`
    if (!p.file) {
      return request<{ message: Message }>(url, json('POST', { text: p.text, quotedId: p.quotedId }))
    }
    const form = new FormData()
    form.append('file', p.file, p.filename || 'file')
    if (p.text) form.append('text', p.text)
    if (p.quotedId) form.append('quotedId', p.quotedId)
    if (p.voice) form.append('voice', '1')
    return request<{ message: Message }>(url, { method: 'POST', body: form })
  },

  seen: (chatId: string) =>
    request(`/api/chats/${encodeURIComponent(chatId)}/seen`, json('POST')),

  presence: (chatId: string, state: 'typing' | 'recording' | 'stop') =>
    request(`/api/chats/${encodeURIComponent(chatId)}/presence`, json('POST', { state })),

  search: (q: string) => request<{ results: SearchResult[] }>(`/api/search${qs({ q })}`),

  directory: (q: string) => request<{ contacts: Contact[] }>(`/api/directory${qs({ q })}`),
}

export const mediaUrl = (messageId: string, download = false) =>
  withKey(`/api/messages/${encodeURIComponent(messageId)}/media${download ? '?download=1' : ''}`)

export const avatarUrl = (chatId: string) =>
  withKey(`/api/chats/${encodeURIComponent(chatId)}/avatar`)
