import { useState, useEffect, useRef } from 'react';
import { Brain, Trash2, Plus } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Modal from '../../components/Modal/index.jsx';
import './MemoriesView.css';

export default function MemoriesView() {
  const [memories, setMemories] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const valueRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/memories');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Record<string, string>;
        if (!cancelled) setMemories(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function openNew() {
    setNewValue('');
    setNewKey('');
    setSaveError(null);
    setShowNew(true);
  }

  function closeNew() {
    setShowNew(false);
  }

  const keyTrimmed = newKey.trim();
  const valueTrimmed = newValue.trim();
  const keyInvalid = keyTrimmed.length > 0 && keyTrimmed.length < 3;
  const valueInvalid = valueTrimmed.length > 0 && valueTrimmed.length < 10;
  const canSubmit = valueTrimmed.length >= 10 && !keyInvalid && !saving;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setSaveError(null);
    try {
      const body: { value: string; key?: string } = { value: valueTrimmed };
      if (keyTrimmed) body.key = keyTrimmed;
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const created = (await res.json()) as { key: string; value: string };
      setMemories((prev) => ({ [created.key]: created.value, ...(prev ?? {}) }));
      closeNew();
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

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
        if (!prev) return prev;
        const next = { ...prev };
        delete next[key!];
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const entries = memories ? Object.entries(memories) : [];

  return (
    <div className="memories-page">
      <div className="memories-page-header">
        <div className="memories-page-heading">
          <Brain size={16} className="memories-page-icon" />
          <h2 className="memories-page-title">Memories</h2>
          <button className="btn btn-primary memories-new-btn" onClick={openNew}>
            <Plus size={13} />
            New
          </button>
        </div>
        <p className="memories-page-hint">
          Stored via <code>bd remember</code> · injected into every AI session
        </p>
      </div>

      {loading && <div className="memories-status">Loading…</div>}

      {error && <div className="memories-status memories-status-error">{error}</div>}

      {!loading && !error && entries.length === 0 && (
        <div className="memories-status">No memories yet.</div>
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

      {showNew && (
        <Modal title="New Memory" onClose={closeNew}>
          <form className="modal-body" onSubmit={handleCreate}>
            <div className="memory-field">
              <label className="memory-field-label" htmlFor="memory-value">
                Content
              </label>
              <textarea
                ref={valueRef}
                id="memory-value"
                className={`memory-field-textarea${valueInvalid ? ' memory-field-invalid' : ''}`}
                placeholder="What should be remembered…"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={4}
                disabled={saving}
                autoFocus
              />
              {valueInvalid && (
                <span className="memory-field-hint">Must be at least 10 characters.</span>
              )}
            </div>
            <div className="memory-field">
              <label className="memory-field-label" htmlFor="memory-key">
                Key <span className="memory-field-optional">(optional)</span>
              </label>
              <input
                id="memory-key"
                className={`memory-field-input${keyInvalid ? ' memory-field-invalid' : ''}`}
                placeholder="auto-generated from content"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                disabled={saving}
              />
              {keyInvalid && (
                <span className="memory-field-hint">Must be at least 3 characters.</span>
              )}
            </div>
            {saveError && <div className="modal-error">{saveError}</div>}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeNew}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                {saving ? 'Saving…' : 'Remember'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
