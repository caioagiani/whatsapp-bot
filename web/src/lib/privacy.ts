import { useCallback, useEffect, useState } from 'react'

const KEY = 'wa.privacyBlur'

const read = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Blur names, previews, avatars and messages; hover reveals. Ctrl/Cmd+Shift+X toggles. */
export function usePrivacyBlur() {
  const [on, setOn] = useState(read)

  const toggle = useCallback(() => setOn((v) => !v), [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, on ? '1' : '0')
    } catch {
      /* per-browser convenience only */
    }
  }, [on])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  return { on, toggle }
}
