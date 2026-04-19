import Modal from './Modal/index.jsx';

interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel?: string;
  confirmClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  confirmClassName = 'btn btn-danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} className="confirm-modal">
      <div className="modal-body">
        {message && <p>{message}</p>}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className={confirmClassName} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
