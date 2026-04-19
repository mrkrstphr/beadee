import { ExternalLink } from 'lucide-react';
import type { ReleaseEntry } from '../routes/api.update.js';
import MarkdownContent from './MarkdownContent/index.jsx';
import Modal from './Modal/index.jsx';

interface UpdateDialogProps {
  latestVersion: string;
  releases: ReleaseEntry[];
  onClose: () => void;
}

export default function UpdateDialog({ latestVersion, releases, onClose }: UpdateDialogProps) {
  return (
    <Modal
      title={`Update Available — v${latestVersion}`}
      onClose={onClose}
      className="update-modal"
    >
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
    </Modal>
  );
}
