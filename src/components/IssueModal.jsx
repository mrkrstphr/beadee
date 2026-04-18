import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createIssue, updateIssue, useLabels } from '../hooks/useIssues.js'
import { toast } from '../hooks/useToast.js'

const TYPES = ['task', 'bug', 'feature', 'chore', 'epic', 'decision', 'spike', 'story', 'milestone']
const PRIORITIES = [
  { value: 0, label: 'P0', cls: 'p0' },
  { value: 1, label: 'P1', cls: 'p1' },
  { value: 2, label: 'P2', cls: 'p2' },
  { value: 3, label: 'P3', cls: 'p3' },
  { value: 4, label: 'P4', cls: 'p4' },
]

function formatDueInitial(dueAt) {
  if (!dueAt) return ''
  const d = new Date(dueAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function parseEstimateField(str) {
  const t = str.trim()
  if (!t) return { ok: true, value: null }
  if (!/^\d+$/.test(t)) return { ok: false }
  const n = parseInt(t, 10)
  if (n < 0) return { ok: false }
  return { ok: true, value: n }
}

function LabelPicker({ value, onChange }) {
  const allLabels = useLabels()
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef(null)
  const listId = useId()

  useEffect(() => { if (adding) inputRef.current?.focus() }, [adding])

  function add(label) {
    const trimmed = label.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
    setAdding(false)
    setInput('')
  }

  function remove(label) {
    onChange(value.filter(l => l !== label))
  }

  return (
    <div className="label-chips">
      {value.map(label => (
        <span key={label} className="label-chip">
          {label}
          <button type="button" className="label-chip-remove" onClick={() => remove(label)} title={`Remove ${label}`}>×</button>
        </span>
      ))}
      {adding ? (
        <>
          <datalist id={listId}>
            {allLabels.filter(({ label }) => !value.includes(label)).map(({ label }) => (
              <option key={label} value={label} />
            ))}
          </datalist>
          <input
            ref={inputRef}
            list={listId}
            className="label-chip-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); add(input) }
              if (e.key === 'Escape') { setAdding(false); setInput('') }
            }}
            onBlur={() => { if (input.trim()) add(input); else setAdding(false) }}
            placeholder="label…"
          />
        </>
      ) : (
        <button type="button" className="label-add-trigger" onClick={() => setAdding(true)}>
          + Add label
        </button>
      )}
    </div>
  )
}

function IssueTypeahead({ value, onChange }) {
  const [inputValue, setInputValue] = useState('')
  const [selected, setSelected] = useState(null) // { id, title }
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)
  const debounceRef = useRef(null)

  // On mount, if value is set (edit mode), fetch the issue title for the pill
  useEffect(() => {
    if (!value) return
    fetch(`/api/issues/${value}`)
      .then(r => r.json())
      .then(d => { if (d.id) setSelected({ id: d.id, title: d.title }) })
      .catch(() => setSelected({ id: value, title: value }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(e) {
    const q = e.target.value
    setInputValue(q)
    setActiveIdx(-1)
    clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/issues?search=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data.slice(0, 8) : [])
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 250)
  }

  function select(issue) {
    setSelected({ id: issue.id, title: issue.title })
    onChange(issue.id)
    setInputValue('')
    setResults([])
    setOpen(false)
  }

  function clear() {
    setSelected(null)
    onChange('')
    setInputValue('')
    setResults([])
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
      setOpen(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIdx >= 0 && results[activeIdx]) {
      e.preventDefault()
      select(results[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (selected) {
    return (
      <div className="typeahead-pill-wrap">
        <span className="typeahead-pill">
          <span className="typeahead-pill-id">{selected.id}</span>
          <button type="button" className="typeahead-pill-clear" onClick={clear} aria-label="Clear parent">×</button>
        </span>
      </div>
    )
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
        onFocus={() => { if (inputValue && results.length) setOpen(true) }}
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
              onMouseDown={e => { e.preventDefault(); select(issue) }}
            >
              <span className="typeahead-option-id">{issue.id}</span>
              <span className="typeahead-option-title">{issue.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function IssueModal({ issue, onClose, onSaved }) {
  const isEdit = !!issue
  const titleRef = useRef(null)

  const [form, setForm] = useState({
    title:       issue?.title       ?? '',
    description: issue?.description ?? '',
    type:        issue?.issue_type  ?? 'task',
    priority:    issue?.priority    ?? 2,
    assignee:    issue?.assignee    ?? '',
    estimate:
      issue?.estimated_minutes != null && issue.estimated_minutes > 0
        ? String(issue.estimated_minutes)
        : '',
    due:          isEdit ? formatDueInitial(issue?.due_at) : '',
    notes:        issue?.notes               ?? '',
    design:       issue?.design              ?? '',
    acceptance:   issue?.acceptance_criteria ?? '',
    external_ref: issue?.external_ref        ?? '',
    parent:       issue?.parent              ?? '',
    labels:       issue?.labels              ?? [],
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(
    !!(issue?.external_ref || issue?.parent)
  )

  useEffect(() => { titleRef.current?.focus() }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    const est = parseEstimateField(form.estimate)
    if (!est.ok) { setError('Estimate must be a non-negative whole number (minutes)'); return }
    setSaving(true)
    setError(null)
    try {
      const data = {
        title:        form.title.trim(),
        description:  form.description.trim() || undefined,
        type:         form.type,
        priority:     form.priority,
        assignee:     form.assignee.trim()     || undefined,
        notes:        form.notes.trim()        || undefined,
        design:       form.design.trim()       || undefined,
        acceptance:   form.acceptance.trim()   || undefined,
        external_ref: form.external_ref.trim() || undefined,
        parent:       form.parent.trim()       || undefined,
        labels:       form.labels,
      }

      const initialDue = isEdit ? formatDueInitial(issue?.due_at) : ''
      const dueTrim = form.due.trim()

      if (isEdit) {
        const prevEst = issue.estimated_minutes
        if (est.value === null) {
          if (prevEst != null && prevEst > 0) data.estimate = null
        } else if (prevEst !== est.value) {
          data.estimate = est.value
        }

        if (!dueTrim) {
          if (issue?.due_at) data.due = null
        } else if (dueTrim !== initialDue) {
          data.due = dueTrim
        }
      } else {
        if (est.value !== null) data.estimate = est.value
        if (dueTrim) data.due = dueTrim
      }

      const saved = isEdit
        ? await updateIssue(issue.id, data)
        : await createIssue(data)
      toast(isEdit ? 'Issue updated' : 'Issue created', 'success')
      onSaved?.(saved, { created: !isEdit })
      onClose()
    } catch (err) {
      setError(err.message)
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Issue' : 'New Issue'}</h3>
          <button className="btn btn-secondary modal-close" onClick={onClose}><X size={14} /></button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {error && <div className="modal-error">{error}</div>}

          <label className="field">
            <span className="field-label">Title <span className="required">*</span></span>
            <input
              ref={titleRef}
              className="field-input"
              placeholder="Short summary"
              value={form.title}
              onChange={e => set('title', e.target.value)}
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
              onChange={e => set('description', e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Acceptance Criteria</span>
            <textarea
              className="field-input"
              rows={3}
              placeholder="Done when…"
              value={form.acceptance}
              onChange={e => set('acceptance', e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              className="field-input field-markdown"
              rows={3}
              placeholder="Supplementary context (markdown)"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Design</span>
            <textarea
              className="field-input field-markdown"
              rows={3}
              placeholder="Architecture decisions, rationale (markdown)"
              value={form.design}
              onChange={e => set('design', e.target.value)}
            />
          </label>

          <div className="field">
            <span className="field-label">Labels</span>
            <LabelPicker value={form.labels} onChange={v => set('labels', v)} />
          </div>

          <div className="field-row">
            <label className="field field-half">
              <span className="field-label">Type</span>
              <select
                className="field-input"
                value={form.type}
                onChange={e => set('type', e.target.value)}
              >
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="field field-half">
              <span className="field-label">Assignee</span>
              <input
                className="field-input"
                placeholder="Username"
                value={form.assignee}
                onChange={e => set('assignee', e.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <span className="field-label">Priority</span>
            <div className="priority-segmented">
              {PRIORITIES.map(p => (
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
                onChange={e => set('estimate', e.target.value)}
              />
            </label>
            <label className="field field-half">
              <span className="field-label">Due</span>
              <input
                type="text"
                className="field-input"
                placeholder="+1d, next monday, 2026-04-15"
                value={form.due}
                onChange={e => set('due', e.target.value)}
                autoComplete="off"
              />
            </label>
          </div>

          <div className="field advanced-toggle">
            <button
              type="button"
              className="advanced-toggle-btn"
              onClick={() => setAdvancedOpen(o => !o)}
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
                  onChange={e => set('external_ref', e.target.value)}
                />
              </label>
              <div className="field field-half">
                <span className="field-label">Parent</span>
                <IssueTypeahead
                  value={form.parent}
                  onChange={v => set('parent', v)}
                />
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
      </div>
    </div>
  )
}
