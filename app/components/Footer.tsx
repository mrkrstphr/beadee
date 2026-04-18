import { useEffect, useState } from 'react';
import { version } from '../../package.json';
import UpdateDialog from './UpdateDialog.jsx';

const CACHE_KEY = 'beadee-update-check';
const CACHE_TTL = 4 * 60 * 60 * 1000;

interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  changelog: string | null;
  releaseUrl: string | null;
}

interface CacheEntry {
  data: UpdateInfo;
  ts: number;
}

function getCached(): UpdateInfo | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as CacheEntry;
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(data: UpdateInfo) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignore localStorage write errors
  }
}

interface FooterProps {
  onShowShortcuts: () => void;
}

export default function Footer({ onShowShortcuts }: FooterProps) {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    function checkForUpdate() {
      const cached = getCached();
      if (cached) {
        // eslint-disable-next-line @eslint-react/set-state-in-effect
        if (cached.hasUpdate) setUpdateInfo(cached);
        return;
      }
      fetch('/api/update')
        .then((r) => r.json() as Promise<UpdateInfo>)
        .then((data) => {
          setCache(data);
          if (data.hasUpdate) setUpdateInfo(data);
        })
        .catch(() => {});
    }

    checkForUpdate();
    const interval = setInterval(checkForUpdate, CACHE_TTL);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <footer className="app-footer">
        <div className="footer-left">
          <a
            className="footer-version"
            href="https://github.com/mrkrstphr/beadee"
            target="_blank"
            rel="noreferrer"
          >
            beadee v{version}
          </a>
          {updateInfo && (
            <button className="footer-update-btn" onClick={() => setShowDialog(true)}>
              v{updateInfo.latestVersion} available
            </button>
          )}
        </div>
        <button
          className="footer-shortcuts-btn"
          onClick={onShowShortcuts}
          title="Keyboard shortcuts (?)"
        >
          <kbd className="kbd kbd-small">?</kbd> shortcuts
        </button>
      </footer>

      {showDialog && updateInfo && (
        <UpdateDialog
          latestVersion={updateInfo.latestVersion}
          changelog={updateInfo.changelog}
          releaseUrl={updateInfo.releaseUrl}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
