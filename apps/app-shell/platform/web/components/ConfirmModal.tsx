import { useCallback, useEffect, useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  onResult: (allowed: boolean) => void
}

export function ConfirmModal({ open, title, message, onResult }: ConfirmModalProps): ReactNode {
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleOverlayClick = useCallback(
    (e: MouseEvent) => {
      if (e.target === overlayRef.current) onResult(false)
    },
    [onResult],
  )

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResult(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onResult])

  if (!open) return null

  return (
    <div className="tdl-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="tdl-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="tdl-modal-title">{title}</div>
        <pre className="tdl-modal-message">{message}</pre>
        <div className="tdl-modal-actions">
          <button type="button" onClick={() => onResult(false)}>
            取消
          </button>
          <button type="button" className="primary" onClick={() => onResult(true)}>
            允许
          </button>
        </div>
      </div>
    </div>
  )
}
