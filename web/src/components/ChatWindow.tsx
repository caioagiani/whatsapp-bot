import { useCallback, useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MoreVertical, BellOff } from 'lucide-react'
import { api, mediaUrl } from '../lib/api'
import { messagesKey, removeMessage, upsertMessage, findChat } from '../lib/cache'
import { formatNumber } from '../lib/format'
import type { Chat, Message, Participant } from '../lib/types'
import { Avatar } from './Avatar'
import { Composer, type Outgoing } from './Composer'
import { MessageList, type MessageListHandle } from './MessageList'
import { Lightbox } from './Lightbox'
import { GroupInfo } from './GroupInfo'

interface Props {
  chatId: string
  fallbackName?: string
  canSend: boolean
  onBack: () => void
}

const TYPE_BY_MIME = (mime: string, voice?: boolean) => {
  if (voice) return 'ptt'
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'document'
}

export function ChatWindow({ chatId, fallbackName, canSend, onBack }: Props) {
  const qc = useQueryClient()
  const list = useRef<MessageListHandle>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [image, setImage] = useState<Message | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const pending = useRef(new Map<string, Outgoing>())

  const { data: chatDetail } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => api.chat(chatId),
    retry: false,
    initialData: () => findChat(qc, chatId),
    staleTime: 60_000,
  })
  const chat: Partial<Chat> & { id: string } = chatDetail ?? { id: chatId, name: fallbackName || null }
  const title = chat.name || fallbackName || formatNumber(chatId)
  const isGroup = chatId.endsWith('@g.us')

  const messages = useInfiniteQuery({
    queryKey: messagesKey(chatId),
    queryFn: async ({ pageParam }) => {
      const page = await api.messages(chatId, pageParam)
      return { ...page, baseCount: page.messages.length }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: Infinity,
  })

  // Mark as read on open and whenever new messages land while it's open.
  const unread = chat.unreadCount ?? 0
  useEffect(() => {
    if (unread > 0 && document.visibilityState === 'visible') {
      void api.seen(chatId).catch(() => undefined)
    }
  }, [chatId, unread])

  useEffect(() => {
    setReplyTo(null)
    setInfoOpen(false)
  }, [chatId])

  const send = useCallback(
    async (o: Outgoing, retryId?: string) => {
      const tempId = retryId ?? `local_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const mime = o.file?.type || ''
      const optimistic: Message = {
        id: tempId,
        chatId,
        fromMe: true,
        author: null,
        authorName: null,
        body: o.text || '',
        type: o.file ? TYPE_BY_MIME(mime, o.voice) : 'chat',
        timestamp: Math.floor(Date.now() / 1000),
        ack: -1,
        hasMedia: Boolean(o.file),
        mediaMime: mime || null,
        mediaFilename: o.filename || null,
        duration: null,
        quotedId: o.quoted ? o.quoted.id.split('_')[2] ?? null : null,
        quotedBody: o.quoted?.body || null,
        quotedAuthor: o.quoted?.author || null,
        isForwarded: false,
        revoked: false,
        localUrl: o.file ? URL.createObjectURL(o.file) : undefined,
        failed: false,
      }
      pending.current.set(tempId, o)
      upsertMessage(qc, optimistic)
      setReplyTo(null)
      setTimeout(() => list.current?.scrollToBottom(), 0)

      try {
        const { message } = await api.send(chatId, {
          text: o.text,
          quotedId: o.quoted?.id,
          file: o.file,
          filename: o.filename,
          voice: o.voice,
        })
        pending.current.delete(tempId)
        if (message) upsertMessage(qc, message, tempId)
        else removeMessage(qc, chatId, tempId)
      } catch {
        upsertMessage(qc, { id: tempId, chatId, failed: true, ack: 0 })
      }
    },
    [chatId, qc],
  )

  const retry = useCallback(
    (m: Message) => {
      const o = pending.current.get(m.id)
      if (!o) return
      upsertMessage(qc, { id: m.id, chatId, failed: false, ack: -1 })
      void send(o, m.id)
    },
    [chatId, qc, send],
  )

  const presence = useCallback(
    (state: 'typing' | 'recording' | 'stop') => {
      if (canSend) void api.presence(chatId, state).catch(() => undefined)
    },
    [canSend, chatId],
  )

  const pages = messages.data?.pages ?? []

  return (
    <div className="chat-window">
      <section className="chat-main">
        <header className="chat-header">
          <button className="icon-btn mobile-only" onClick={onBack} aria-label="Voltar">
            <ArrowLeft size={22} />
          </button>
          <button className="chat-header__info" onClick={() => setInfoOpen((o) => !o)}>
            <Avatar id={chatId} name={title} isGroup={isGroup} size={40} />
            <div className="chat-header__text">
              <span className="chat-header__title">
                {title} {chat.muted && <BellOff size={14} />}
              </span>
              <span className="chat-header__sub">
                {isGroup ? 'clique para ver os participantes' : chat.name ? formatNumber(chatId) : ''}
              </span>
            </div>
          </button>
          <div className="chat-header__actions">
            <button className="icon-btn" title="Mais" onClick={() => setInfoOpen((o) => !o)}>
              <MoreVertical size={20} />
            </button>
          </div>
        </header>

        {messages.isPending ? (
          <div className="messages messages--loading">
            <div className="spinner" />
          </div>
        ) : messages.isError ? (
          <div className="messages messages--loading">
            <span className="muted">Não foi possível carregar as mensagens.</span>
            <button className="link-btn" onClick={() => messages.refetch()}>
              Tentar de novo
            </button>
          </div>
        ) : (
          <MessageList
            key={chatId}
            ref={list}
            pages={pages}
            isGroup={isGroup}
            hasOlder={Boolean(messages.hasNextPage)}
            loadingOlder={messages.isFetchingNextPage}
            onLoadOlder={() => void messages.fetchNextPage()}
            onReply={setReplyTo}
            onOpenImage={setImage}
            onRetry={retry}
          />
        )}

        <Composer
          chatId={chatId}
          disabled={!canSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSend={(o) => void send(o)}
          onPresence={presence}
        />
      </section>

      {infoOpen && (
        <GroupInfo
          chatId={chatId}
          title={title}
          isGroup={isGroup}
          participants={(chatDetail as { participants?: Participant[] } | undefined)?.participants}
          onClose={() => setInfoOpen(false)}
        />
      )}

      {image && (
        <Lightbox
          src={image.localUrl || mediaUrl(image.id)}
          download={image.localUrl || mediaUrl(image.id, true)}
          onClose={() => setImage(null)}
        />
      )}
    </div>
  )
}

