import { Lock } from 'lucide-react'

export function Intro({ name }: { name: string | null }) {
  return (
    <div className="intro">
      <div className="intro__art" aria-hidden>
        <svg viewBox="0 0 120 120" width="160" height="160">
          <circle cx="60" cy="60" r="58" fill="var(--intro-circle)" />
          <path
            fill="var(--brand)"
            d="M60 26a34 34 0 0 0-29.4 51L26 94l17.6-4.6A34 34 0 1 0 60 26zm18.6 47.6c-.8 2.2-4.5 4.3-6.3 4.5-1.6.2-3.7.3-6-.4-1.4-.4-3.2-1-5.4-2-9.5-4.1-15.7-13.7-16.2-14.3-.5-.6-3.9-5.2-3.9-9.9s2.5-7 3.3-8a3.5 3.5 0 0 1 2.6-1.2h1.9c.6 0 1.4-.2 2.2 1.7l3.1 7.6c.3.6.4 1.2.1 1.9l-1.1 1.8-1.6 1.8c-.5.5-1.1 1.1-.5 2.1.6 1 2.7 4.4 5.8 7.1 4 3.5 7.3 4.6 8.4 5.1.9.4 1.5.4 2-.2l2.8-3.4c.7-.9 1.4-.8 2.2-.5l7.2 3.4c1 .4 1.6.7 1.9 1.1.2.4.2 2.4-.6 4.6z"
          />
        </svg>
      </div>
      <h1>WhatsApp Bot{name ? ` · ${name}` : ''}</h1>
      <p>
        Envie e receba mensagens pelo bot. As conversas ficam salvas localmente,
        <br />
        então o histórico continua disponível mesmo com o WhatsApp offline.
      </p>
      <span className="intro__foot">
        <Lock size={13} /> Dados armazenados apenas neste servidor
      </span>
    </div>
  )
}
