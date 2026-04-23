import { useEffect, useRef, useState } from 'react';
import { X, Ghost } from 'lucide-react';
import { useIssues } from '../../hooks/api/useIssues.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useLocalStorageState } from '../../hooks/useLocalStorageState.js';
import StatusIcon from '../StatusIcon/index.jsx';
import { PRIORITY_LABEL, TYPE_SHORT } from '../../constants.js';
import './SearchPalette.css';

interface SearchPaletteProps {
  onClose: () => void;
  onSelect: (id: string) => void;
}

export default function SearchPalette({ onClose, onSelect }: SearchPaletteProps) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [includeClosed, setIncludeClosed] = useLocalStorageState(
    'beadee-search-include-closed',
    false,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const { issues: allIssues } = useIssues({
    search: debouncedQuery.length >= 2 ? debouncedQuery : undefined,
  });
  const issues = includeClosed ? allIssues : allIssues.filter((i) => i.status !== 'closed');

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, issues.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
      return;
    }
    if (e.key === 'Enter' && issues[cursor]) {
      onSelect(issues[cursor].id);
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal search-palette-modal" onKeyDown={handleKeyDown}>
        <div className="search-palette-input-row">
          <input
            autoFocus
            className="search-palette-input"
            type="search"
            placeholder="Search issues…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
          />
          <button className="btn btn-secondary modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="search-palette-options">
          <button
            className={`pill${includeClosed ? ' active' : ''}`}
            onClick={() => setIncludeClosed((v) => !v)}
          >
            Include closed
          </button>
        </div>

        <div ref={listRef} className="search-palette-results">
          {issues.length === 0 && debouncedQuery.length >= 2 && (
            <div className="search-palette-empty">
              <Ghost size={32} strokeWidth={1.25} className="search-palette-ghost" />
              <span>No issues found</span>
            </div>
          )}
          {issues.map((issue, idx) => (
            <button
              key={issue.id}
              data-idx={idx}
              className={`search-palette-row${idx === cursor ? ' active' : ''}`}
              onMouseEnter={() => setCursor(idx)}
              onClick={() => {
                onSelect(issue.id);
                onClose();
              }}
            >
              <StatusIcon status={issue.status} />
              {issue.priority != null && (
                <span className={`priority-badge p${issue.priority}`}>
                  {PRIORITY_LABEL[issue.priority]}
                </span>
              )}
              {issue.issue_type && (
                <span className={`badge-type type-${issue.issue_type}`}>
                  {TYPE_SHORT[issue.issue_type] ?? issue.issue_type}
                </span>
              )}
              <span className="search-palette-id">{issue.id}</span>
              <span className="search-palette-title">{issue.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
