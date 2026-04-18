import { useEffect } from 'react';
import { X } from 'lucide-react';
import MarkdownContent from './MarkdownContent.jsx';

export default function UpdateDialog({ latestVersion, changelog, releaseUrl, onClose }) {
  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal update-modal">
        <div className="modal-header">
          <h3 className="modal-title">
            Update Available —{' '}
            {releaseUrl ? (
              <a href={releaseUrl} target="_blank" rel="noreferrer">
                v{latestVersion}
              </a>
            ) : (
              `v${latestVersion}`
            )}
          </h3>
          <button className="btn btn-secondary modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="modal-body">
          {changelog && (
            <div className="update-changelog">
              <MarkdownContent text={changelog} />
            </div>
          )}
          <div className="update-instructions">
            <p>
              <strong>To upgrade:</strong>
            </p>
            <pre className="update-cmd">npm install -g @mrkrstphr/beadee</pre>
            <p>Or run without installing:</p>
            <pre className="update-cmd">npx @mrkrstphr/beadee</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
