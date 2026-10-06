import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './lib/api'
import { useRealtime } from './lib/realtime'
import { chatTitle } from './lib/format'
import type { Message } from './lib/types'
import { findChat } from './lib/cache'
import { Sidebar } from './components/Sidebar'
import { ChatWindow } from './components/ChatWindow'
import { ConnectionScreen } from './components/ConnectionScreen'
import { Intro } from './components/Intro'

const readHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')) || null

export default function App() {
  const qc = useQueryClient()
  const [active, setActive] = useState<{ id: string; name?: string } | null>(() => {
    const id = readHash()
    return id ? { id } : null
  })

  const { data: status } = useQuery({
    queryKey: ['status'],
    queryFn: api.status,
    refetchInterval: (q) => (q.state.data?.status === 'ready' ? false : 5000),
  })

  // Desktop notification + unread title for messages in other chats.
  const onIncoming = useCallback(
    (m: Message) => {
      if (document.visibilityState === 'visible' && active?.id === m.chatId) {
        void api.seen(m.chatId).catch(() => undefined)
        return
      }
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        const chat = findChat(qc, m.chatId)
        const n = new Notification(chat ? chatTitle(chat) : 'Nova mensagem', {
          body: m.body || 'Mídia',
          tag: m.chatId,
        })
        n.onclick = () => {
          window.focus()
          setActive({ id: m.chatId })
        }
      }
    },
    [active?.id, qc],
  )
  useRealtime(onIncoming)

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const ask = () => void Notification.requestPermission()
      window.addEventListener('click', ask, { once: true })
      return () => window.removeEventListener('click', ask)
    }
  }, [])

  // Keep the open chat in the URL so reloads and back/forward work.
  useEffect(() => {
    const target = active ? `#/${encodeURIComponent(active.id)}` : ''
    if (location.hash !== target) history.pushState(null, '', target || location.pathname)
  }, [active])
  useEffect(() => {
    const onPop = () => {
      const id = readHash()
      setActive(id ? { id } : null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const open = useCallback((id: string, name?: string) => setActive({ id, name }), [])

  if (status?.status === 'qr') return <ConnectionScreen status={status} />

  return (
    <div className={`app ${active ? 'has-chat' : ''}`}>
      <Sidebar activeId={active?.id ?? null} botName={status?.name ?? null} status={status?.status} onOpen={open} />
      <main className="content">
        {active ? (
          <ChatWindow
            key={active.id}
            chatId={active.id}
            fallbackName={active.name}
            canSend={status?.status === 'ready'}
            onBack={() => setActive(null)}
          />
        ) : (
          <Intro name={status?.name ?? null} />
        )}
      </main>
    </div>
  )
}
