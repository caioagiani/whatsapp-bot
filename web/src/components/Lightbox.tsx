import { useEffect } from 'react'
import { Download, X } from 'lucide-react'

export function Lightbox({ src, download, onClose }: { src: string; download: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="lightbox" onClick={onClose}>
      <div className="lightbox__bar" onClick={(e) => e.stopPropagation()}>
        <a className="icon-btn" href={download} title="Baixar">
          <Download size={22} />
        </a>
        <button className="icon-btn" onClick={onClose} title="Fechar">
          <X size={24} />
        </button>
      </div>
      <img src={src} alt="" onClick={(e) => e.stopPropagation()} />
    </div>
  )
}
