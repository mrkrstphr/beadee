import { useEffect, useId, useRef, useState } from 'react';
import { useLabels } from '../hooks/api/useLabels.js';
import { useCreateIssue } from '../hooks/api/useCreateIssue.js';
import type { CreateIssueData } from '../hooks/api/useCreateIssue.js';
import { useUpdateIssue } from '../hooks/api/useUpdateIssue.js';
import type { UpdateIssueData } from '../hooks/api/useUpdateIssue.js';
import { toast } from '../hooks/useToast.js';
import type { Issue, LabelItem } from '../types.js';
import Modal from './Modal/index.jsx';

const TYPES = [
  'task',
  'bug',
  'feature',
  'chore',
  'epic',
  'decision',
  'spike',
  'story',
  'milestone',
];
const PRIORITIES = [
  { value: 0, label: 'P0', cls: 'p0' },
  { value: 1, label: 'P1', cls: 'p1' },
  { value: 2, label: 'P2', cls: 'p2' },
  { value: 3, label: 'P3', cls: 'p3' },
  { value: 4, label: 'P4', cls: 'p4' },
];

function formatDueInitial(dueAt: string | null | undefined): string {
  if (!dueAt) return '';
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function parseEstimateField(str: string): { ok: boolean; value?: number | null } {
  const t = str.trim();
  if (!t) return { ok: true, value: null };
  if (!/^\d+$/.test(t)) return { ok: false };
  const n = parseInt(t, 10);
  if (n < 0) return { ok: false };
  return { ok: true, value: n };
}

interface LabelPickerProps {
  value: string[];
  onChange: (labels: string[]) => void;
}

function LabelPicker({ value, onChange }: LabelPickerProps) {
  const allLabels = useLabels();
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  function add(label: string) {
    const trimmed = label.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setAdding(false);
    setInput('');
  }

  function remove(label: string) {
    onChange(value.filter((l) => l !== label));
  }

  return (
    <div className="label-chips">
      {value.map((label) => (
        <span key={label} className="label-chip">
          {label}
          <button
            type="button"
            className="label-chip-remove"
            onClick={() => remove(label)}
            title={`Remove ${label}`}
          >
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <>
          <datalist id={listId}>
            {allLabels
              .filter(({ label }: LabelItem) => !value.includes(label))
              .map(({ label }: LabelItem) => (
                <option key={label} value={label} />
              ))}
          </datalist>
          <input
            ref={inputRef}
            list={listId}
            className="label-chip-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add(input);
              }
              if (e.key === 'Escape') {
                setAdding(false);
                setInput('');
              }
            }}
            onBlur={() => {
              if (input.trim()) add(input);
              else setAdding(false);
            }}
            placeholder="label…"
          />
        </>
      ) : (
        <button type="button" className="label-add-trigger" onClick={() => setAdding(true)}>
          + Add label
        </button>
      )}
    </div>
  );
}

interface SearchResult {
  id: string;
  title: string;
}

interface IssueTypeaheadProps {
  value: string;
  onChange: (id: string) => void;
}

function IssueTypeahead({ value, onChange }: IssueTypeaheadProps) {
  const [inputValue, setInputValue] = useState('');
  const [resolvedTitle, setResolvedTitle] = useState<string | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusAfterClearRef = useRef(false);

  const selected: SearchResult | null =
    value && resolvedId === value ? { id: resolvedId, title: resolvedTitle ?? value } : null;

  useEffect(() => {
    if (!value) return;
    const controller = new AbortController();
    fetch(`/api/issues/${value}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<SearchResult>)
      .then((d) => {
        setResolvedId(d.id ?? value);
        setResolvedTitle(d.title ?? value);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setResolvedId(value);
          setResolvedTitle(value);
        }
      });
    return () => controller.abort();
  }, [value]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (focusAfterClearRef.current) {
      focusAfterClearRef.current = false;
      inputRef.current?.focus();
    }
  });

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setInputValue(q);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/issues?search=${encodeURIComponent(q)}`);
        const data = (await res.json()) as SearchResult[];
        setResults(Array.isArray(data) ? data.slice(0, 8) : []);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);
  }

  function select(issue: SearchResult) {
    setResolvedId(issue.id);
    setResolvedTitle(issue.title);
    onChange(issue.id);
    setInputValue('');
    setResults([]);
    setOpen(false);
  }

  function clear() {
    focusAfterClearRef.current = true;
    setResolvedId(null);
    setResolvedTitle(null);
    onChange('');
    setInputValue('');
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
      setOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0 && results[activeIdx]) {
      e.preventDefault();
      select(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  if (selected) {
    return (
      <div className="typeahead-pill-wrap">
        <span className="typeahead-pill">
          <span className="typeahead-pill-id">{selected.id}</span>
          <button
            type="button"
            className="typeahead-pill-clear"
            onClick={clear}
            aria-label="Clear parent"
          >
            ×
          </button>
        </span>
      </div>
    );
  }

  return (
    <div className="typeahead-wrap" ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        className="field-input"
        placeholder="Search issues…"
        value={inputValue}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (inputValue && results.length) setOpen(true);
        }}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ul className="typeahead-dropdown" role="listbox">
          {results.map((issue, i) => (
            <li
              key={issue.id}
              role="option"
              aria-selected={i === activeIdx}
              className={`typeahead-option${i === activeIdx ? ' active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(issue);
              }}
            >
              <span className="typeahead-option-id">{issue.id}</span>
              <span className="typeahead-option-title">{issue.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface IssueModalProps {
  issue?: Issue | null;
  onClose: () => void;
  onSaved?: (saved: Issue, opts?: { created?: boolean }) => void;
}

interface FormState {
  title: string;
  description: string;
  type: string;
  priority: number;
  assignee: string;
  estimate: string;
  due: string;
  notes: string;
  design: string;
  acceptance: string;
  external_ref: string;
  parent: string;
  labels: string[];
}

export default function IssueModal({ issue, onClose, onSaved }: IssueModalProps) {
  const isEdit = !!issue;
  const titleRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(() => ({
    title: issue?.title ?? '',
    description: issue?.description ?? '',
    type: issue?.issue_type ?? 'task',
    priority: issue?.priority ?? 2,
    assignee: issue?.assignee ?? '',
    estimate:
      issue?.estimated_minutes != null && issue.estimated_minutes > 0
        ? String(issue.estimated_minutes)
        : '',
    due: isEdit ? formatDueInitial(issue?.due_at) : '',
    notes: issue?.notes ?? '',
    design: issue?.design ?? '',
    acceptance: issue?.acceptance_criteria ?? '',
    external_ref: issue?.external_ref ?? '',
    parent: issue?.parent ?? '',
    labels: issue?.labels ?? [],
  }));
  const createIssue = useCreateIssue();
  const updateIssue = useUpdateIssue();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(!!(issue?.external_ref || issue?.parent));

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    const est = parseEstimateField(form.estimate);
    if (!est.ok) {
      setError('Estimate must be a non-negative whole number (minutes)');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const dueTrim = form.due.trim();

      let saved: Issue;
      if (isEdit) {
        const initialDue = formatDueInitial(issue?.due_at);
        const prevEst = issue!.estimated_minutes;

        const payload: UpdateIssueData = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          priority: form.priority,
          assignee: form.assignee.trim() || undefined,
          notes: form.notes.trim() || undefined,
          design: form.design.trim() || undefined,
          acceptance: form.acceptance.trim() || undefined,
          external_ref: form.external_ref.trim() || undefined,
          parent: form.parent.trim() || undefined,
          labels: form.labels,
        };

        if (est.value === null) {
          if (prevEst != null && prevEst > 0) payload.estimate = null;
        } else if (prevEst !== est.value) {
          payload.estimate = est.value;
        }

        if (!dueTrim) {
          if (issue?.due_at) payload.due = null;
        } else if (dueTrim !== initialDue) {
          payload.due = dueTrim;
        }

        saved = await updateIssue.mutateAsync({ id: issue!.id, data: payload });
      } else {
        const payload: CreateIssueData = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          type: form.type,
          priority: form.priority,
          notes: form.notes.trim() || undefined,
          design: form.design.trim() || undefined,
          acceptance: form.acceptance.trim() || undefined,
          external_ref: form.external_ref.trim() || undefined,
          parent: form.parent.trim() || undefined,
          labels: form.labels,
        };

        if (est.value !== null) payload.estimate = est.value;
        if (dueTrim) payload.due = dueTrim;

        saved = await createIssue.mutateAsync(payload);
      }
      toast(isEdit ? 'Issue updated' : 'Issue created', 'success');
      onSaved?.(saved, { created: !isEdit });
      onClose();
    } catch (err) {
      setError((err as Error).message);
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Issue' : 'New Issue'} onClose={onClose}>
      <form className="modal-body" onSubmit={handleSubmit}>
        {error && <div className="modal-error">{error}</div>}

        <label className="field">
          <span className="field-label">
            Title <span className="required">*</span>
          </span>
          <input
            ref={titleRef}
            className="field-input"
            placeholder="Short summary"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Description</span>
          <textarea
            className="field-input"
            rows={6}
            placeholder="Why this issue exists and what needs to be done"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Acceptance Criteria</span>
          <textarea
            className="field-input"
            rows={3}
            placeholder="Done when…"
            value={form.acceptance}
            onChange={(e) => set('acceptance', e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Notes</span>
          <textarea
            className="field-input field-markdown"
            rows={3}
            placeholder="Supplementary context (markdown)"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Design</span>
          <textarea
            className="field-input field-markdown"
            rows={3}
            placeholder="Architecture decisions, rationale (markdown)"
            value={form.design}
            onChange={(e) => set('design', e.target.value)}
          />
        </label>

        <div className="field">
          <span className="field-label">Labels</span>
          <LabelPicker value={form.labels} onChange={(v) => set('labels', v)} />
        </div>

        <div className="field-row">
          <label className="field field-half">
            <span className="field-label">Type</span>
            <select
              className="field-input"
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="field field-half">
            <span className="field-label">Assignee</span>
            <input
              className="field-input"
              placeholder="Username"
              value={form.assignee}
              onChange={(e) => set('assignee', e.target.value)}
            />
          </label>
        </div>

        <div className="field">
          <span className="field-label">Priority</span>
          <div className="priority-segmented">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`priority-seg-btn ${p.cls} ${form.priority === p.value ? 'active' : ''}`}
                onClick={() => set('priority', p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <label className="field field-half">
            <span className="field-label">Estimate (minutes)</span>
            <input
              type="number"
              min={0}
              step={1}
              className="field-input"
              placeholder="Optional"
              value={form.estimate}
              onChange={(e) => set('estimate', e.target.value)}
            />
          </label>
          <label className="field field-half">
            <span className="field-label">Due</span>
            <input
              type="text"
              className="field-input"
              placeholder="+1d, next monday, 2026-04-15"
              value={form.due}
              onChange={(e) => set('due', e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>

        <div className="field advanced-toggle">
          <button
            type="button"
            className="advanced-toggle-btn"
            onClick={() => setAdvancedOpen((o) => !o)}
            aria-expanded={advancedOpen}
          >
            <span className={`advanced-caret ${advancedOpen ? 'open' : ''}`}>▶</span>
            Advanced
          </button>
        </div>

        {advancedOpen && (
          <div className="field-row">
            <label className="field field-half">
              <span className="field-label">External Ref</span>
              <input
                type="text"
                className="field-input"
                placeholder="gh-9, jira-ABC-123"
                value={form.external_ref}
                onChange={(e) => set('external_ref', e.target.value)}
              />
            </label>
            <div className="field field-half">
              <span className="field-label">Parent</span>
              <IssueTypeahead value={form.parent} onChange={(v) => set('parent', v)} />
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
