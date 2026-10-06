import { memo } from 'react'
import { BellOff, Pin } from 'lucide-react'
import type { Chat } from '../lib/types'
import { chatTitle, formatListDate } from '../lib/format'
import { Avatar } from './Avatar'
import { Ticks } from './Ticks'

interface Props {
  chat: Chat
  active: boolean
  onClick: (chat: Chat) => void
}

export const ChatItem = memo(function ChatItem({ chat, active, onClick }: Props) {
  const title = chatTitle(chat)
  const unread = chat.unreadCount > 0

  return (
    <button className={`chat-item ${active ? 'is-active' : ''}`} onClick={() => onClick(chat)}>
      <Avatar id={chat.id} name={title} isGroup={chat.isGroup} />
      <div className="chat-item__body">
        <div className="chat-item__row">
          <span className="chat-item__name">{title}</span>
          <span className={`chat-item__date ${unread ? 'is-unread' : ''}`}>
            {formatListDate(chat.lastMessageAt)}
          </span>
        </div>
        <div className="chat-item__row">
          <span className="chat-item__preview">
            {chat.lastMessageFromMe && chat.lastMessageType !== 'revoked' && (
              <Ticks ack={chat.lastMessageAck} size={16} />
            )}
            <span>{chat.lastMessagePreview || ''}</span>
          </span>
          <span className="chat-item__icons">
            {chat.muted && <BellOff size={16} />}
            {chat.pinned && <Pin size={16} />}
            {unread && <span className="unread-badge">{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span>}
          </span>
        </div>
      </div>
    </button>
  )
})
