import { useEffect, useState } from 'react';
import { version } from '../../package.json';
import UpdateDialog from './UpdateDialog.jsx';

const CACHE_KEY = 'beadee-update-check';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

export default function Footer({ onShowShortcuts }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    function checkForUpdate() {
      const cached = getCached();
      if (cached) {
        if (cached.hasUpdate) setUpdateInfo(cached);
        return;
      }
      fetch('/api/update')
        .then((r) => r.json())
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

      {showDialog && (
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
