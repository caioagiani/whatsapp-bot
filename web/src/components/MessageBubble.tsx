import { memo, useState } from 'react'
import { ChevronDown, FileText, Forward, MapPin, Phone, Ban, User, Download, RotateCw } from 'lucide-react'
import type { Message } from '../lib/types'
import { mediaUrl } from '../lib/api'
import { authorColor, formatNumber, formatTime } from '../lib/format'
import { RichText } from './RichText'
import { Ticks } from './Ticks'
import { AudioPlayer } from './AudioPlayer'

const SYSTEM_TYPES = new Set(['gp2', 'notification', 'broadcast_notification', 'call_log'])

interface Props {
  msg: Message
  showAuthor: boolean
  tail: boolean
  isGroup: boolean
  onReply: (m: Message) => void
  onOpenImage: (m: Message) => void
  onJumpTo: (stanzaId: string) => void
  onRetry: (m: Message) => void
}

function Media({ msg, onOpenImage }: { msg: Message; onOpenImage: (m: Message) => void }) {
  const [loaded, setLoaded] = useState(false)
  const src = msg.localUrl || mediaUrl(msg.id)

  switch (msg.type) {
    case 'image':
      return (
        <button className={`bubble__image ${loaded ? 'is-loaded' : ''}`} onClick={() => onOpenImage(msg)}>
          <img src={src} alt="" loading="lazy" decoding="async" onLoad={() => setLoaded(true)} />
        </button>
      )
    case 'sticker':
      return <img className="bubble__sticker" src={src} alt="Figurinha" loading="lazy" />
    case 'video':
      return <video className="bubble__video" src={src} controls preload="none" playsInline />
    case 'ptt':
    case 'audio':
      return <AudioPlayer src={src} duration={msg.duration} voice={msg.type === 'ptt'} />
    default:
      return (
        <a className="bubble__doc" href={msg.localUrl || mediaUrl(msg.id, true)} target="_blank" rel="noreferrer">
          <FileText size={30} />
          <span className="bubble__doc-name">{msg.mediaFilename || 'Documento'}</span>
          <Download size={20} />
        </a>
      )
  }
}

export const MessageBubble = memo(function MessageBubble({
  msg,
  showAuthor,
  tail,
  isGroup,
  onReply,
  onOpenImage,
  onJumpTo,
  onRetry,
}: Props) {
  if (SYSTEM_TYPES.has(msg.type)) {
    return (
      <div className="system-msg">
        <span>
          {msg.type === 'call_log' && <Phone size={14} />}
          {msg.body || (msg.type === 'call_log' ? 'Chamada de voz' : 'Atualização do grupo')}
        </span>
      </div>
    )
  }

  const out = msg.fromMe
  const isSticker = msg.type === 'sticker'
  const isMediaOnly = ['image', 'video', 'sticker'].includes(msg.type) && !msg.body
  const caption = ['image', 'video', 'chat', 'document'].includes(msg.type) || !msg.hasMedia

  let content: React.ReactNode
  if (msg.revoked) {
    content = (
      <span className="bubble__revoked">
        <Ban size={15} /> {out ? 'Você apagou esta mensagem' : 'Esta mensagem foi apagada'}
      </span>
    )
  } else if (msg.type === 'location') {
    content = (
      <span className="bubble__inline-icon">
        <MapPin size={18} /> {msg.body || 'Localização'}
      </span>
    )
  } else if (msg.type === 'vcard' || msg.type === 'multi_vcard') {
    const name = msg.body.match(/FN:(.+)/)?.[1] || 'Contato'
    content = (
      <span className="bubble__inline-icon">
        <User size={18} /> {name}
      </span>
    )
  } else {
    content = (
      <>
        {msg.hasMedia && <Media msg={msg} onOpenImage={onOpenImage} />}
        {caption && msg.body && msg.type !== 'document' && (
          <div className="bubble__text">
            <RichText text={msg.body} />
          </div>
        )}
      </>
    )
  }

  const authorLabel = msg.authorName || formatNumber(msg.author) || 'Participante'

  return (
    <div className={`msg-row ${out ? 'msg-row--out' : 'msg-row--in'} ${tail ? 'has-tail' : ''}`} data-id={msg.id}>
      <div
        className={`bubble ${out ? 'bubble--out' : 'bubble--in'} ${isSticker ? 'bubble--sticker' : ''} ${
          isMediaOnly ? 'bubble--media' : ''
        }`}
      >
        {!msg.revoked && (
          <button className="bubble__menu" onClick={() => onReply(msg)} title="Responder">
            <ChevronDown size={18} />
          </button>
        )}

        {isGroup && !out && showAuthor && (
          <div className="bubble__author" style={{ color: authorColor(msg.author) }}>
            {authorLabel}
          </div>
        )}

        {msg.isForwarded && (
          <div className="bubble__forwarded">
            <Forward size={14} /> Encaminhada
          </div>
        )}

        {msg.quotedId && (
          <button className="quote" onClick={() => onJumpTo(msg.quotedId!)}>
            <span className="quote__author" style={{ color: authorColor(msg.quotedAuthor) }}>
              {msg.quotedAuthor ? formatNumber(msg.quotedAuthor) : 'Mensagem citada'}
            </span>
            <span className="quote__body">{msg.quotedBody ? <RichText text={msg.quotedBody} /> : 'Mídia'}</span>
          </button>
        )}

        {content}

        <span className="bubble__meta">
          {formatTime(msg.timestamp)}
          {out && <Ticks ack={msg.ack} failed={msg.failed} />}
        </span>

        {msg.failed && (
          <button className="bubble__retry" onClick={() => onRetry(msg)}>
            <RotateCw size={14} /> Tentar de novo
          </button>
        )}
      </div>
    </div>
  )
})
