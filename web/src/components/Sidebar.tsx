import { useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Virtuoso } from 'react-virtuoso'
import { Archive, ArrowLeft, MessageSquarePlus, Search, X } from 'lucide-react'
import { api } from '../lib/api'
import { formatListDate } from '../lib/format'
import { useDebounced } from '../lib/hooks'
import type { BotStatus, Chat, ChatFilter } from '../lib/types'
import { Avatar } from './Avatar'
import { ChatItem } from './ChatItem'
import { NewChat } from './NewChat'
import { Highlight } from './RichText'

interface Props {
  activeId: string | null
  botName: string | null
  status: BotStatus | undefined
  syncing: boolean
  onOpen: (id: string, name?: string) => void
}

const FILTERS: { key: ChatFilter; label: string }[] = [
  { key: 'all', label: 'Tudo' },
  { key: 'unread', label: 'Não lidas' },
  { key: 'groups', label: 'Grupos' },
]

const STATUS_BANNER: Partial<Record<BotStatus, string>> = {
  initializing: 'Conectando ao WhatsApp…',
  authenticated: 'Sincronizando conversas…',
  disconnected: 'WhatsApp desconectado — exibindo histórico salvo',
}

interface ListContext {
  showArchived: boolean
  openArchived: () => void
  loadingMore: boolean
  empty: boolean
  busy: boolean
}

// Module-level so Virtuoso doesn't remount them on every render.
const LIST_COMPONENTS = {
  Header: ({ context }: { context?: ListContext }) =>
    context?.showArchived ? (
      <button className="archived-row" onClick={context.openArchived}>
        <Archive size={20} />
        <span>Arquivadas</span>
      </button>
    ) : null,
  Footer: ({ context }: { context?: ListContext }) => (
    <>
      {context?.loadingMore && <div className="spinner spinner--center" />}
      {context?.empty && <p className="empty">{context.busy ? 'Carregando conversas…' : 'Nenhuma conversa ainda.'}</p>}
    </>
  ),
}

export function Sidebar({ activeId, botName, status, syncing, onOpen }: Props) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<ChatFilter>('all')
  const [archived, setArchived] = useState(false)
  const [newChat, setNewChat] = useState(false)
  const query = useDebounced(q.trim(), 250)

  const chats = useInfiniteQuery({
    queryKey: ['chats', filter, query, archived],
    queryFn: ({ pageParam }) => api.chats({ cursor: pageParam, q: query, filter, archived }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 30_000,
  })

  const search = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.search(query),
    enabled: query.length >= 2,
    staleTime: 15_000,
  })

  const items: Chat[] = chats.data?.pages.flatMap((p) => p.chats) ?? []
  const results = query.length >= 2 ? search.data?.results ?? [] : []
  const banner =
    (status && STATUS_BANNER[status]) || (status === 'ready' && syncing ? 'Sincronizando mensagens recentes…' : undefined)
  const busy = status === 'initializing' || status === 'authenticated' || syncing

  return (
    <aside className="sidebar">
      <NewChat
        open={newChat}
        onClose={() => setNewChat(false)}
        onPick={(id, name) => {
          setNewChat(false)
          onOpen(id, name)
        }}
      />

      <header className="sidebar__head">
        {archived ? (
          <>
            <button className="icon-btn" onClick={() => setArchived(false)} aria-label="Voltar">
              <ArrowLeft size={22} />
            </button>
            <span className="sidebar__title">Arquivadas</span>
          </>
        ) : (
          <>
            <div className="sidebar__me" title={botName || ''}>
              <Avatar id="me" name={botName || 'Bot'} size={40} noImage />
              <span className="sidebar__title">{botName || 'WhatsApp Bot'}</span>
            </div>
            <div className="sidebar__actions">
              <button className="icon-btn" title="Nova conversa" onClick={() => setNewChat(true)}>
                <MessageSquarePlus size={22} />
              </button>
            </div>
          </>
        )}
      </header>

      {banner && (
        <div className={`banner banner--${status}`}>
          {busy && <span className="spinner spinner--sm" />}
          {banner}
        </div>
      )}
      {busy && <div className="progress" />}

      <div className="search">
        <div className="search__box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Pesquisar conversa ou mensagem"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="icon-btn icon-btn--sm" onClick={() => setQ('')} aria-label="Limpar">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {!archived && !query && (
        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? 'is-active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="chat-list">
        {chats.isPending ? (
          <div className="spinner spinner--center" />
        ) : query ? (
          <div className="chat-list__plain">
            {items.length > 0 && <h4 className="list-heading">Conversas</h4>}
            {items.map((chat) => (
              <ChatItem key={chat.id} chat={chat} active={chat.id === activeId} onClick={(c) => onOpen(c.id)} />
            ))}
            {query.length >= 2 && (
              <div className="search-results">
                <h4 className="list-heading">Mensagens</h4>
                {search.isPending && <div className="spinner spinner--center" />}
                {search.data && results.length === 0 && <p className="empty">Nenhuma mensagem encontrada.</p>}
                {results.map((r) => (
                  <button key={r.id} className="search-hit" onClick={() => onOpen(r.chatId, r.chatName || undefined)}>
                    <div className="chat-item__row">
                      <span className="chat-item__name">{r.chatName || r.chatId.split('@')[0]}</span>
                      <span className="chat-item__date">{formatListDate(r.timestamp)}</span>
                    </div>
                    <span className="search-hit__snippet">
                      {r.fromMe ? 'Você: ' : r.isGroup && r.authorName ? `${r.authorName}: ` : ''}
                      <Highlight text={r.snippet} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Virtuoso
            data={items}
            computeItemKey={(_, c) => c.id}
            endReached={() => chats.hasNextPage && !chats.isFetchingNextPage && chats.fetchNextPage()}
            increaseViewportBy={400}
            context={{
              showArchived: !archived && filter === 'all',
              openArchived: () => setArchived(true),
              loadingMore: chats.isFetchingNextPage,
              empty: items.length === 0,
              busy,
            }}
            components={LIST_COMPONENTS}
            itemContent={(_, chat) => (
              <ChatItem chat={chat} active={chat.id === activeId} onClick={(c) => onOpen(c.id)} />
            )}
          />
        )}
      </div>
    </aside>
  )
}
