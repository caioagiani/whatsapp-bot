import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Paperclip, Send, Smile, Trash2, X, FileText } from 'lucide-react'
import type { Message } from '../lib/types'
import { authorColor, formatBytes, formatDuration, formatNumber } from '../lib/format'

const EmojiPicker = lazy(() => import('./EmojiPanel'))

export interface Outgoing {
  text?: string
  file?: File | Blob
  filename?: string
  voice?: boolean
  quoted?: Message | null
}

interface Props {
  chatId: string
  disabled: boolean
  replyTo: Message | null
  onCancelReply: () => void
  onSend: (o: Outgoing) => void
  onPresence: (state: 'typing' | 'recording' | 'stop') => void
}

const pickRecorderMime = () =>
  ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(
    (t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t),
  )

function useRecorder(onDone: (blob: Blob) => void) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const cancelled = useRef(false)
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const stopTracks = () => recorder.current?.stream.getTracks().forEach((t) => t.stop())

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = pickRecorderMime()
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    chunks.current = []
    cancelled.current = false
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
    rec.onstop = () => {
      stopTracks()
      clearInterval(timer.current)
      setRecording(false)
      if (!cancelled.current && chunks.current.length) {
        onDone(new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' }))
      }
    }
    rec.start(250)
    recorder.current = rec
    setElapsed(0)
    setRecording(true)
    const began = Date.now()
    timer.current = setInterval(() => setElapsed((Date.now() - began) / 1000), 200)
  }

  const stop = () => recorder.current?.state === 'recording' && recorder.current.stop()
  const cancel = () => {
    cancelled.current = true
    stop()
  }

  useEffect(() => () => {
    cancelled.current = true
    stop()
  }, [])

  return { recording, elapsed, start, stop, cancel }
}

export function Composer({ chatId, disabled, replyTo, onCancelReply, onSend, onPresence }: Props) {
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const lastTyping = useRef(0)

  // Each chat keeps its own draft.
  useEffect(() => {
    let draft = ''
    try {
      draft = sessionStorage.getItem(`draft:${chatId}`) || ''
    } catch {
      draft = ''
    }
    setText(draft)
    setFiles([])
    setEmojiOpen(false)
    input.current?.focus()
  }, [chatId])

  useEffect(() => {
    try {
      if (text) sessionStorage.setItem(`draft:${chatId}`, text)
      else sessionStorage.removeItem(`draft:${chatId}`)
    } catch {
      /* drafts are best-effort */
    }
  }, [chatId, text])

  useEffect(() => {
    if (replyTo) input.current?.focus()
  }, [replyTo])

  // Auto-grow up to ~6 lines.
  useEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [text])

  const recorder = useRecorder((blob) => {
    onPresence('stop')
    onSend({ file: blob, filename: 'voice.ogg', voice: true, quoted: replyTo })
  })

  const sendText = () => {
    const value = text.trim()
    if (!value || disabled) return
    onSend({ text: value, quoted: replyTo })
    setText('')
    setEmojiOpen(false)
    onPresence('stop')
    lastTyping.current = 0
  }

  const sendFiles = () => {
    files.forEach((file, i) =>
      onSend({ file, filename: file.name, text: i === 0 ? caption.trim() : undefined, quoted: i === 0 ? replyTo : null }),
    )
    setFiles([])
    setCaption('')
  }

  const onType = (value: string) => {
    setText(value)
    const now = Date.now()
    if (value && now - lastTyping.current > 8000) {
      lastTyping.current = now
      onPresence('typing')
    }
  }

  const insertEmoji = useCallback((emoji: string) => {
    const el = input.current
    if (!el) {
      setText((t) => t + emoji)
      return
    }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    setText((t) => t.slice(0, start) + emoji + t.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }, [])

  const onPaste = (e: React.ClipboardEvent) => {
    const pasted = Array.from(e.clipboardData.files)
    if (pasted.length) {
      e.preventDefault()
      setFiles(pasted)
    }
  }

  const previewUrl = useMemo(
    () => (files[0]?.type.startsWith('image/') ? URL.createObjectURL(files[0]) : null),
    [files],
  )
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  if (files.length) {
    const first = files[0]
    const isImage = first.type.startsWith('image/')
    return (
      <div className="attach-preview">
        <div className="attach-preview__head">
          <button className="icon-btn" onClick={() => setFiles([])} title="Cancelar">
            <X size={22} />
          </button>
          <span>{files.length > 1 ? `${files.length} arquivos` : first.name}</span>
        </div>
        <div className="attach-preview__body">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt="" />
          ) : (
            <div className="attach-preview__file">
              <FileText size={64} />
              <span>{first.name}</span>
              <small>{formatBytes(first.size)}</small>
            </div>
          )}
        </div>
        <div className="attach-preview__foot">
          <input
            autoFocus
            placeholder="Adicione uma legenda"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendFiles()}
          />
          <button className="send-btn" onClick={sendFiles} disabled={disabled} title="Enviar">
            <Send size={22} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="composer-wrap">
      {emojiOpen && (
        <Suspense fallback={<div className="emoji-panel emoji-panel--loading"><div className="spinner" /></div>}>
          <EmojiPicker onPick={insertEmoji} />
        </Suspense>
      )}

      {replyTo && (
        <div className="reply-bar">
          <div className="reply-bar__quote" style={{ borderColor: authorColor(replyTo.author) }}>
            <span style={{ color: authorColor(replyTo.author) }}>
              {replyTo.fromMe ? 'Você' : replyTo.authorName || formatNumber(replyTo.author)}
            </span>
            <p>{replyTo.body || (replyTo.hasMedia ? 'Mídia' : '')}</p>
          </div>
          <button className="icon-btn" onClick={onCancelReply} title="Cancelar resposta">
            <X size={20} />
          </button>
        </div>
      )}

      <footer className="composer">
        {recorder.recording ? (
          <div className="recorder">
            <button className="icon-btn" onClick={() => { recorder.cancel(); onPresence('stop') }} title="Descartar">
              <Trash2 size={22} />
            </button>
            <span className="recorder__dot" />
            <span className="recorder__time">{formatDuration(recorder.elapsed)}</span>
            <div className="recorder__wave" />
            <button className="send-btn" onClick={recorder.stop} title="Enviar áudio">
              <Send size={22} />
            </button>
          </div>
        ) : (
          <>
            <button
              className={`icon-btn ${emojiOpen ? 'is-active' : ''}`}
              onClick={() => setEmojiOpen((o) => !o)}
              title="Emoji"
            >
              {emojiOpen ? <X size={24} /> : <Smile size={24} />}
            </button>
            <button className="icon-btn" onClick={() => fileInput.current?.click()} title="Anexar">
              <Paperclip size={22} />
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                setFiles(Array.from(e.target.files || []))
                e.target.value = ''
              }}
            />
            <textarea
              ref={input}
              rows={1}
              className="composer__input"
              placeholder={disabled ? 'WhatsApp desconectado' : 'Digite uma mensagem'}
              value={text}
              disabled={disabled}
              onChange={(e) => onType(e.target.value)}
              onPaste={onPaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  sendText()
                }
                if (e.key === 'Escape') replyTo ? onCancelReply() : setEmojiOpen(false)
              }}
            />
            {text.trim() ? (
              <button className="send-btn" onClick={sendText} disabled={disabled} title="Enviar">
                <Send size={22} />
              </button>
            ) : (
              <button
                className="icon-btn"
                disabled={disabled || typeof MediaRecorder === 'undefined'}
                onClick={() => {
                  recorder.start().then(() => onPresence('recording')).catch(() => alert('Permita o acesso ao microfone para gravar áudio.'))
                }}
                title="Gravar áudio"
              >
                <Mic size={24} />
              </button>
            )}
          </>
        )}
      </footer>
    </div>
  )
}

