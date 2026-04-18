import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', confirmClassName = 'btn btn-danger', onConfirm, onCancel }) {
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal confirm-modal">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-secondary modal-close" onClick={onCancel}><X size={14} /></button>
        </div>
        <div className="modal-body">
          {message && <p>{message}</p>}
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button className={confirmClassName} onClick={onConfirm}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
