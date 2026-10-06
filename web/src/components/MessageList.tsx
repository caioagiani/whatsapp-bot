import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { ChevronDown } from 'lucide-react'
import type { Message, MessagePage } from '../lib/types'
import { formatDayLabel, sameDay } from '../lib/format'
import { MessageBubble } from './MessageBubble'

// Virtuoso needs a monotonically decreasing first index when prepending.
const START_INDEX = 1_000_000

interface Props {
  pages: MessagePage[]
  isGroup: boolean
  hasOlder: boolean
  loadingOlder: boolean
  onLoadOlder: () => void
  onReply: (m: Message) => void
  onOpenImage: (m: Message) => void
  onRetry: (m: Message) => void
}

interface ListContext {
  hasOlder: boolean
  loadingOlder: boolean
}

// Defined at module level: inline component props remount on every render
// and make Virtuoso re-measure, which shows up as scroll jumps.
const ListHeader = ({ context }: { context?: ListContext }) => (
  <div className="messages__header">
    {context?.loadingOlder ? <div className="spinner" /> : !context?.hasOlder && <span>Início da conversa</span>}
  </div>
)
const ListFooter = () => <div style={{ height: 8 }} />
const LIST_COMPONENTS = { Header: ListHeader, Footer: ListFooter }

export interface MessageListHandle {
  scrollToBottom: () => void
}

export const MessageList = forwardRef<MessageListHandle, Props>(function MessageList(
  { pages, isGroup, hasOlder, loadingOlder, onLoadOlder, onReply, onOpenImage, onRetry },
  ref,
) {
  const virtuoso = useRef<VirtuosoHandle>(null)
  const [atBottom, setAtBottom] = useState(true)
  const [highlight, setHighlight] = useState<string | null>(null)

  const items = useMemo(() => [...pages].reverse().flatMap((p) => p.messages), [pages])

  // Items prepended by older pages shift the index; realtime appends don't.
  const olderCount = useMemo(
    () => pages.slice(1).reduce((n, p) => n + p.messages.length, 0) + (pages[0]?.baseCount ?? 0),
    [pages],
  )
  const firstItemIndex = START_INDEX - olderCount

  const scrollToBottom = useCallback(() => {
    virtuoso.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'auto' })
  }, [])

  useImperativeHandle(ref, () => ({ scrollToBottom }), [scrollToBottom])

  const jumpTo = useCallback(
    (stanzaId: string) => {
      const index = items.findIndex((m) => m.id.split('_')[2] === stanzaId || m.id.endsWith(stanzaId))
      if (index < 0) return
      virtuoso.current?.scrollToIndex({ index, align: 'center', behavior: 'smooth' })
      const id = items[index].id
      setHighlight(id)
      setTimeout(() => setHighlight((h) => (h === id ? null : h)), 1600)
    },
    [items],
  )

  return (
    <div className="messages">
      <Virtuoso
        ref={virtuoso}
        className="messages__scroller"
        data={items}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={Math.max(0, items.length - 1)}
        alignToBottom
        increaseViewportBy={{ top: 800, bottom: 400 }}
        computeItemKey={(_, m) => m.id}
        startReached={() => hasOlder && !loadingOlder && onLoadOlder()}
        followOutput={(bottom) => (bottom ? 'auto' : false)}
        atBottomStateChange={setAtBottom}
        atBottomThreshold={120}
        context={{ hasOlder, loadingOlder }}
        components={LIST_COMPONENTS}
        itemContent={(index, msg) => {
          const i = index - firstItemIndex
          const prev = items[i - 1]
          const newDay = !prev || !sameDay(prev.timestamp, msg.timestamp)
          const sameAuthor =
            !newDay && prev && prev.fromMe === msg.fromMe && prev.author === msg.author && prev.type !== 'gp2'
          return (
            <div className={highlight === msg.id ? 'msg-highlight' : undefined}>
              {newDay && (
                <div className="day-sep">
                  <span>{formatDayLabel(msg.timestamp)}</span>
                </div>
              )}
              <MessageBubble
                msg={msg}
                isGroup={isGroup}
                showAuthor={!sameAuthor}
                tail={!sameAuthor}
                onReply={onReply}
                onOpenImage={onOpenImage}
                onJumpTo={jumpTo}
                onRetry={onRetry}
              />
            </div>
          )
        }}
      />
      {!atBottom && (
        <button className="scroll-bottom" onClick={scrollToBottom} aria-label="Ir para o fim">
          <ChevronDown size={24} />
        </button>
      )}
    </div>
  )
})
