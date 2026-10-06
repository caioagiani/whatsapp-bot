const DAY = 86_400_000

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

export const formatTime = (ts: number) =>
  new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** Chat list timestamp: time today, "Ontem", weekday this week, else date. */
export const formatListDate = (ts: number) => {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const diff = startOfDay(new Date()) - startOfDay(d)
  if (diff <= 0) return formatTime(ts)
  if (diff === DAY) return 'Ontem'
  if (diff < 7 * DAY) return d.toLocaleDateString('pt-BR', { weekday: 'long' })
  return d.toLocaleDateString('pt-BR')
}

export const formatDayLabel = (ts: number) => {
  const d = new Date(ts * 1000)
  const diff = startOfDay(new Date()) - startOfDay(d)
  if (diff <= 0) return 'Hoje'
  if (diff === DAY) return 'Ontem'
  if (diff < 7 * DAY) return d.toLocaleDateString('pt-BR', { weekday: 'long' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export const sameDay = (a: number, b: number) =>
  startOfDay(new Date(a * 1000)) === startOfDay(new Date(b * 1000))

export const formatDuration = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** "5511999998888@c.us" → "+55 11 99999-8888" */
export const formatNumber = (id: string | null | undefined) => {
  if (!id) return ''
  const user = id.split('@')[0]
  if (!/^\d+$/.test(user)) return user
  const m = user.match(/^55(\d{2})(\d{4,5})(\d{4})$/)
  if (m) return `+55 ${m[1]} ${m[2]}-${m[3]}`
  return `+${user}`
}

export const chatTitle = (chat: { id: string; name: string | null }) =>
  chat.name || formatNumber(chat.id)

const AUTHOR_COLORS = [
  '#e542a3', '#1f7aec', '#d6851b', '#02a698', '#7f66ff',
  '#c4532d', '#35a24b', '#a62c71', '#0c87a8', '#b3802e',
]

export const authorColor = (id: string | null) => {
  if (!id) return AUTHOR_COLORS[0]
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return AUTHOR_COLORS[Math.abs(h) % AUTHOR_COLORS.length]
}

export const initials = (name: string) =>
  name
    .replace(/[^\p{L}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

export const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 ** 2).toFixed(1)} MB`
}
