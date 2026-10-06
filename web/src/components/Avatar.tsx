import { memo, useState } from 'react'
import { User, Users } from 'lucide-react'
import { avatarUrl } from '../lib/api'
import { authorColor, initials } from '../lib/format'

interface Props {
  id: string
  name: string
  isGroup?: boolean
  size?: number
  /** Skip the network fetch and render initials directly. */
  noImage?: boolean
}

export const Avatar = memo(function Avatar({ id, name, isGroup, size = 49, noImage }: Props) {
  const [failed, setFailed] = useState(Boolean(noImage))
  const style = { width: size, height: size, fontSize: size * 0.38 }

  if (failed) {
    return (
      <div className="avatar avatar--fallback" style={{ ...style, background: authorColor(id) }}>
        {isGroup ? <Users size={size * 0.5} /> : initials(name) || <User size={size * 0.5} />}
      </div>
    )
  }

  return (
    <img
      className="avatar"
      style={style}
      src={avatarUrl(id)}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
})
