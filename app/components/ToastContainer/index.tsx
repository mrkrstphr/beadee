import { CircleCheck, CircleX } from 'lucide-react';
import { useToast } from '../../hooks/useToast.js';
import './ToastContainer.css';

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
          {t.type === 'success' ? (
            <CircleCheck size={14} strokeWidth={2} />
          ) : (
            <CircleX size={14} strokeWidth={2} />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
