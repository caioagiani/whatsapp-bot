import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'

export function Ticks({ ack, failed, size = 16 }: { ack: number | null; failed?: boolean; size?: number }) {
  if (failed) return <AlertCircle size={size - 2} className="ticks ticks--failed" />
  if (ack === null || ack <= 0) return <Clock size={size - 4} className="ticks" />
  if (ack === 1) return <Check size={size} className="ticks" />
  return <CheckCheck size={size} className={`ticks ${ack >= 3 ? 'ticks--read' : ''}`} />
}
