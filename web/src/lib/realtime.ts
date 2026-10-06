import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getApiKey } from './api'
import { removeChat, setStatus, upsertChat, upsertMessage } from './cache'
import type { Chat, Message, Status } from './types'

type Event =
  | { type: 'status'; data: Status }
  | { type: 'message.new' | 'message.update'; data: Partial<Message> & { id: string; chatId: string } }
  | { type: 'chat.update'; data: Chat }
  | { type: 'chat.remove'; data: { id: string } }
  | { type: 'sync'; data: { state: 'started' | 'done' } }

export const useRealtime = (onIncoming?: (m: Message) => void) => {
  const qc = useQueryClient()
  const incoming = useRef(onIncoming)
  incoming.current = onIncoming

  useEffect(() => {
    let ws: WebSocket | null = null
    let retry = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let closed = false

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const key = getApiKey()
      ws = new WebSocket(`${proto}://${location.host}/ws${key ? `?key=${encodeURIComponent(key)}` : ''}`)

      ws.onopen = () => {
        // Anything that happened while we were away: refetch what's on screen.
        if (retry > 0) void qc.invalidateQueries()
        retry = 0
      }

      ws.onmessage = (e) => {
        const event = JSON.parse(e.data) as Event
        switch (event.type) {
          case 'status':
            setStatus(qc, event.data)
            break
          case 'message.new':
          case 'message.update':
            if (!event.data) break
            upsertMessage(qc, event.data)
            if (event.type === 'message.new' && !event.data.fromMe) {
              incoming.current?.(event.data as Message)
            }
            break
          case 'chat.update':
            upsertChat(qc, event.data)
            break
          case 'chat.remove':
            removeChat(qc, event.data.id)
            break
          case 'sync': {
            const syncing = event.data.state === 'started'
            qc.setQueryData<Status>(['status'], (s) => (s ? { ...s, syncing } : s))
            if (!syncing) void qc.invalidateQueries({ queryKey: ['chats'] })
            break
          }
        }
      }

      ws.onclose = () => {
        if (closed) return
        timer = setTimeout(connect, Math.min(10_000, 500 * 2 ** retry++))
      }
    }

    connect()
    return () => {
      closed = true
      clearTimeout(timer)
      ws?.close()
    }
  }, [qc])
}
