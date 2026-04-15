import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { createIssue, updateIssue } from '../hooks/useIssues.js'
import { toast } from '../hooks/useToast.js'

const TYPES = ['task', 'bug', 'feature', 'chore', 'epic', 'decision', 'spike', 'story', 'milestone']
const PRIORITIES = [
  { value: 0, label: 'P0', cls: 'p0' },
  { value: 1, label: 'P1', cls: 'p1' },
  { value: 2, label: 'P2', cls: 'p2' },
  { value: 3, label: 'P3', cls: 'p3' },
  { value: 4, label: 'P4', cls: 'p4' },
]

export default function IssueModal({ issue, onClose, onSaved }) {
  const isEdit = !!issue
  const titleRef = useRef(null)

  const [form, setForm] = useState({
    title:       issue?.title       ?? '',
    description: issue?.description ?? '',
    type:        issue?.issue_type  ?? 'task',
    priority:    issue?.priority    ?? 2,
    assignee:    issue?.assignee    ?? '',
  })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

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
    setSaving(true)
    setError(null)
    try {
      const data = {
        title:       form.title.trim(),
        description: form.description.trim() || undefined,
        type:        form.type,
        priority:    form.priority,
        assignee:    form.assignee.trim() || undefined,
      }
      const saved = isEdit
        ? await updateIssue(issue.id, data)
        : await createIssue(data)
      toast(isEdit ? 'Issue updated' : 'Issue created', 'success')
      onSaved?.(saved)
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
