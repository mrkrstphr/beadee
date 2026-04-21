import { useState, useRef } from 'react';
import MarkdownContent from '../MarkdownContent/index.jsx';
import './InlineTextEdit.css';

interface InlineTextEditProps {
  value: string | null | undefined;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export default function InlineTextEdit({
  value,
  onSave,
  placeholder = 'Click to add…',
  className,
}: InlineTextEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function startEditing() {
    setDraft(value ?? '');
    setEditing(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }

  if (editing) {
    return (
      <div className={`inline-text-edit-wrap${className ? ` ${className}` : ''}`}>
        <textarea
          ref={textareaRef}
          className="inline-text-edit-textarea"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          disabled={saving}
          rows={4}
        />
        <div className="inline-text-edit-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (value) {
    return (
      <button
        className={`inline-text-edit-view${className ? ` ${className}` : ''}`}
        onClick={startEditing}
        title="Click to edit"
      >
        <MarkdownContent text={value} className="inline-text-edit-content" />
      </button>
    );
  }

  return (
    <button
      className={`inline-text-edit-empty${className ? ` ${className}` : ''}`}
      onClick={startEditing}
    >
      {placeholder}
    </button>
  );
}
