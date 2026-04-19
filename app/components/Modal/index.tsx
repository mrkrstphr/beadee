import { X } from 'lucide-react';
import { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ title, onClose, children, className }: ModalProps) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${className ? ` ${className}` : ''}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-secondary modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
