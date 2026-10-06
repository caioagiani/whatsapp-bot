import { X, Shield } from 'lucide-react'
import type { Participant } from '../lib/types'
import { formatNumber } from '../lib/format'
import { Avatar } from './Avatar'

interface Props {
  chatId: string
  title: string
  isGroup: boolean
  participants?: Participant[]
  onClose: () => void
}

export function GroupInfo({ chatId, title, isGroup, participants, onClose }: Props) {
  return (
    <aside className="side-panel">
      <header className="side-panel__head">
        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
          <X size={22} />
        </button>
        <span>{isGroup ? 'Dados do grupo' : 'Dados do contato'}</span>
      </header>
      <div className="side-panel__body">
        <div className="side-panel__hero">
          <Avatar id={chatId} name={title} isGroup={isGroup} size={200} />
          <h2>{title}</h2>
          <p className="muted">
            {isGroup ? `Grupo · ${participants?.length ?? '…'} participantes` : formatNumber(chatId)}
          </p>
        </div>

        {isGroup && (
          <section className="side-panel__section">
            <h3>{participants ? `${participants.length} participantes` : 'Participantes'}</h3>
            {!participants && <p className="muted">Disponível quando o WhatsApp estiver conectado.</p>}
            <ul className="participants">
              {participants
                ?.slice()
                .sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin))
                .map((p) => (
                  <li key={p.id}>
                    <Avatar id={p.id} name={p.number} size={40} />
                    <span className="participants__name">{formatNumber(p.id) || 'Participante'}</span>
                    {(p.isAdmin || p.isSuperAdmin) && (
                      <span className="badge">
                        <Shield size={12} /> admin
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>
    </aside>
  )
}
