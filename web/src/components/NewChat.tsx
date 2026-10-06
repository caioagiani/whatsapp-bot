import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Search, Phone } from 'lucide-react'
import { api } from '../lib/api'
import { formatNumber } from '../lib/format'
import { useDebounced } from '../lib/hooks'
import { Avatar } from './Avatar'

interface Props {
  open: boolean
  onClose: () => void
  onPick: (id: string, name: string) => void
}

export function NewChat({ open, onClose, onPick }: Props) {
  const [q, setQ] = useState('')
  const debounced = useDebounced(q, 200)
  const { data, isPending } = useQuery({
    queryKey: ['directory', debounced],
    queryFn: () => api.directory(debounced),
    enabled: open,
    staleTime: 60_000,
  })

  const digits = q.replace(/\D/g, '')

  return (
    <div className={`drawer ${open ? 'is-open' : ''}`} inert={!open}>
      <header className="drawer__head">
        <button className="icon-btn" onClick={onClose} aria-label="Voltar">
          <ArrowLeft size={22} />
        </button>
        <span>Nova conversa</span>
      </header>
      <div className="search">
        <div className="search__box">
          <Search size={18} />
          <input placeholder="Pesquisar nome ou número" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="drawer__list">
        {digits.length >= 10 && (
          <button className="contact-item" onClick={() => onPick(`${digits}@c.us`, formatNumber(digits))}>
            <div className="avatar avatar--fallback avatar--brand">
              <Phone size={22} />
            </div>
            <span>Conversar com {formatNumber(digits)}</span>
          </button>
        )}
        {isPending && open && <div className="spinner spinner--center" />}
        {data?.contacts.map((c) => {
          const name = c.name || c.pushname || formatNumber(c.id)
          return (
            <button key={c.id} className="contact-item" onClick={() => onPick(c.id, name)}>
              <Avatar id={c.id} name={name} size={44} />
              <div className="contact-item__text">
                <span>{name}</span>
                <small>{formatNumber(c.id)}</small>
              </div>
            </button>
          )
        })}
        {data && data.contacts.length === 0 && digits.length < 10 && (
          <p className="empty">Nenhum contato encontrado.</p>
        )}
      </div>
    </div>
  )
}
