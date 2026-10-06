import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Mic } from 'lucide-react'
import { formatDuration } from '../lib/format'

interface Props {
  src: string
  duration?: number | null
  voice?: boolean
}

export function AudioPlayer({ src, duration, voice }: Props) {
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [total, setTotal] = useState(duration || 0)
  const [rate, setRate] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onTime = () => setTime(el.currentTime)
    const onMeta = () => Number.isFinite(el.duration) && setTotal(el.duration)
    const onEnd = () => {
      setPlaying(false)
      setTime(0)
    }
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('ended', onEnd)
    el.addEventListener('pause', () => setPlaying(false))
    el.addEventListener('play', () => setPlaying(true))
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('ended', onEnd)
    }
  }, [])

  const toggle = () => {
    const el = ref.current
    if (!el) return
    if (el.paused) {
      // Only one audio at a time, like WhatsApp.
      document.querySelectorAll('audio').forEach((a) => a !== el && a.pause())
      void el.play()
    } else el.pause()
  }

  const cycleRate = () => {
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1
    setRate(next)
    if (ref.current) ref.current.playbackRate = next
  }

  return (
    <div className="audio">
      <audio ref={ref} src={src} preload="none" />
      {voice && <Mic size={18} className="audio__mic" />}
      <button className="icon-btn audio__play" onClick={toggle} aria-label={playing ? 'Pausar' : 'Tocar'}>
        {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
      </button>
      <div className="audio__track">
        <input
          type="range"
          min={0}
          max={total || 1}
          step={0.1}
          value={time}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (ref.current) ref.current.currentTime = v
            setTime(v)
          }}
          style={{ '--progress': `${total ? (time / total) * 100 : 0}%` } as React.CSSProperties}
        />
        <div className="audio__meta">
          <span>{formatDuration(playing || time ? time : total)}</span>
          {playing && (
            <button className="audio__rate" onClick={cycleRate}>
              {rate}×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
