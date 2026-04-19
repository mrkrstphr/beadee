import { useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import MarkdownContent from './MarkdownContent/index.jsx';
import type { ReleaseEntry } from '../routes/api.update.js';

interface UpdateDialogProps {
  latestVersion: string;
  releases: ReleaseEntry[];
  onClose: () => void;
}

export default function UpdateDialog({ latestVersion, releases, onClose }: UpdateDialogProps) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal update-modal">
        <div className="modal-header">
          <h3 className="modal-title">Update Available — v{latestVersion}</h3>
          <button className="btn btn-secondary modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="modal-body update-modal-body">
          <div className="update-releases">
            {releases.map((release) => (
              <div key={release.version} className="update-release">
                <h4 className="update-release-heading">
                  {release.releaseUrl ? (
                    <a href={release.releaseUrl} target="_blank" rel="noreferrer">
                      v{release.version} <ExternalLink size={12} />
                    </a>
                  ) : (
                    `v${release.version}`
                  )}
                </h4>
                {release.changelog && (
                  <div className="update-changelog">
                    <MarkdownContent text={release.changelog} />
                  </div>
                )}
              </div>
            ))}
          </div>
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
