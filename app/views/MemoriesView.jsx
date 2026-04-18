import { useState, useEffect } from 'react';
import { Brain, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function MemoriesView() {
  const [memories, setMemories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmKey, setConfirmKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/memories');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setMemories(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete() {
    const key = confirmKey;
    setConfirmKey(null);
    try {
      const res = await fetch('/api/memories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMemories((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (e) {
      setError(e.message);
    }
  }

  const entries = memories ? Object.entries(memories) : [];

  return (
    <div className="memories-page">
      <div className="memories-page-header">
        <div className="memories-page-heading">
          <Brain size={16} className="memories-page-icon" />
          <h2 className="memories-page-title">Memories</h2>
        </div>
        <p className="memories-page-hint">
          Stored via <code>bd remember</code> · injected into every AI session
        </p>
      </div>

      {loading && <div className="memories-status">Loading…</div>}

      {error && <div className="memories-status memories-status-error">{error}</div>}

      {!loading && !error && entries.length === 0 && (
        <div className="memories-status">
          No memories yet. Run <code>bd remember "…"</code> in your project to add one.
        </div>
      )}

      {entries.length > 0 && (
        <ul className="memories-cards">
          {entries.map(([key, value]) => (
            <li key={key} className="memory-card">
              <div className="memory-card-top">
                <span className="memory-card-key">{key}</span>
                <button
                  className="memory-delete-btn"
                  onClick={() => setConfirmKey(key)}
                  title="Forget this memory"
                  aria-label="Forget this memory"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="memory-card-value">{value}</p>
            </li>
          ))}
        </ul>
      )}

      {confirmKey && (
        <ConfirmDialog
          title="Forget memory?"
          message={`This will permanently delete "${confirmKey}".`}
          confirmLabel="Forget"
          onConfirm={handleDelete}
          onCancel={() => setConfirmKey(null)}
        />
      )}
    </div>
  );
}
