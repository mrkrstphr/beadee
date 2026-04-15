import { CircleCheck, CircleX } from 'lucide-react'

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => onDismiss(t.id)}
        >
          {t.type === 'success'
            ? <CircleCheck size={14} strokeWidth={2} />
            : <CircleX size={14} strokeWidth={2} />
          }
          {t.message}
        </div>
      ))}
    </div>
  )
}
