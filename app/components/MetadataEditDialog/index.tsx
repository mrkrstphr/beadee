import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useUpdateIssue } from '../../hooks/api/useUpdateIssue.js';
import Modal from '../Modal/index.js';
import './MetadataEditDialog.css';

interface MetadataEditDialogProps {
  issueId: string;
  existing: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
}

interface Row {
  id: number;
  key: string;
  value: string;
}

export default function MetadataEditDialog({
  issueId,
  existing,
  onClose,
  onSaved,
}: MetadataEditDialogProps) {
  const nextId = useRef(0);
  const [rows, setRows] = useState<Row[]>(() =>
    Object.entries(existing).map(([key, value]) => ({ id: nextId.current++, key, value })),
  );
  const [error, setError] = useState<string | null>(null);
  const updateIssue = useUpdateIssue();
  const pendingFocus = useRef(false);
  const lastKeyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    lastKeyRef.current?.focus();
  }, [rows.length]);

  function addRow() {
    pendingFocus.current = true;
    setRows((r) => [...r, { id: nextId.current++, key: '', value: '' }]);
  }

  function removeRow(id: number) {
    setRows((r) => r.filter((row) => row.id !== id));
  }

  function updateRow(id: number, field: 'key' | 'value', val: string) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: val } : row)));
  }

  async function handleSave() {
    const filled = rows.filter((r) => r.key.trim() !== '' || r.value.trim() !== '');

    const dupKeys = filled
      .map((r) => r.key.trim().toLowerCase())
      .filter((k, i, arr) => k !== '' && arr.indexOf(k) !== i);
    if (dupKeys.length > 0) {
      setError(`Duplicate key: "${dupKeys[0]}"`);
      return;
    }

    const invalid = filled.find((r) => r.key.trim() === '' && r.value.trim() !== '');
    if (invalid) {
      setError('Key cannot be empty when a value is set');
      return;
    }

    const newMeta: Record<string, string> = {};
    for (const r of filled) {
      if (r.key.trim()) newMeta[r.key.trim()] = r.value.trim();
    }

    const existingKeys = Object.keys(existing);
    const newKeys = Object.keys(newMeta);
    const toUnset = existingKeys.filter((k) => !newKeys.includes(k));

    if (newKeys.length === 0 && toUnset.length === 0) {
      onClose();
      return;
    }

    setError(null);
    try {
      await updateIssue.mutateAsync({
        id: issueId,
        data: {
          ...(newKeys.length > 0 ? { metadata: newMeta } : {}),
          ...(toUnset.length > 0 ? { metadataUnset: toUnset } : {}),
        },
      });
      onSaved();
      onClose();
    } catch (err) {
      setError((err as Error).message ?? 'Failed to save');
    }
  }

  const saving = updateIssue.isPending;

  return (
    <Modal title="Edit Metadata" onClose={onClose} className="meta-edit-modal">
      <div className="meta-edit-body">
        {rows.length === 0 && (
          <p className="meta-edit-empty">No metadata yet. Add a key-value pair below.</p>
        )}
        {rows.length > 0 && (
          <div className="meta-edit-rows">
            <div className="meta-edit-row">
              <span className="field-label meta-edit-key">Key</span>
              <span className="field-label meta-edit-val">Value</span>
              <span className="meta-edit-col-spacer" />
            </div>
            {rows.map((row, i) => (
              <div className="meta-edit-row" key={row.id}>
                <input
                  ref={i === rows.length - 1 ? lastKeyRef : undefined}
                  className="field-input meta-edit-key"
                  placeholder="key"
                  value={row.key}
                  onChange={(e) => updateRow(row.id, 'key', e.target.value)}
                  disabled={saving}
                  onKeyDown={(e) => e.key === 'Enter' && addRow()}
                />
                <input
                  className="field-input meta-edit-val"
                  placeholder="value"
                  value={row.value}
                  onChange={(e) => updateRow(row.id, 'value', e.target.value)}
                  disabled={saving}
                  onKeyDown={(e) => e.key === 'Enter' && addRow()}
                />
                <button
                  className="meta-edit-remove"
                  onClick={() => removeRow(row.id)}
                  disabled={saving}
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-secondary meta-edit-add" onClick={addRow} disabled={saving}>
          + Add pair
        </button>

        {error && <div className="modal-error">{error}</div>}
      </div>

      <div className="meta-edit-footer">
        <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}
