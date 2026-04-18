import { useState, useRef, useEffect } from 'react'
import { Check, Copy, ChevronDown, User, X } from 'lucide-react'
import { useIssue, useChildren, updateIssue, closeIssue, addLabel, removeLabel, useLabels } from '../hooks/useIssues.js'
import { toast } from '../hooks/useToast.js'
import { useKeyboard } from '../hooks/useKeyboard.js'
import CommentThread from './CommentThread.jsx'
import MarkdownContent from './MarkdownContent.jsx'
import StatusIcon from './StatusIcon.jsx'

const PRIORITY_LABEL = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' }
const ALL_STATUSES = ['open', 'in_progress', 'blocked', 'deferred', 'pinned', 'closed']

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function DepChip({ dep, onSelect }) {
  return (
    <button className="dep-chip" onClick={() => onSelect(dep.id)} title={dep.title}>
      <StatusIcon status={dep.status} size={12} />
      <span className="dep-chip-id">{dep.id}</span>
      <span className="dep-chip-title">{dep.title}</span>
    </button>
  )
}

function LabelChip({ label, onRemove }) {
  return (
    <span className="label-chip">
      {label}
      {onRemove && (
        <button className="label-chip-remove" onClick={() => onRemove(label)} title={`Remove ${label}`}>
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}

function LabelAddTrigger({ issueId }) {
  const allLabels = useLabels()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)
  const listId = `label-suggestions-${issueId}`

  function open() {
    setEditing(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function commit() {
    const trimmed = value.trim()
    if (!trimmed || busy) { close(); return }
    setBusy(true)
    try {
      await addLabel(issueId, trimmed)
      // SSE broadcast triggers useIssue to refetch
    } catch (err) {
      // SSE will update anyway
    } finally {
      setBusy(false)
      close()
    }
  }

  function close() {
    setEditing(false)
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commit() }
    if (e.key === 'Escape') { e.preventDefault(); close() }
  }

  function handleBlur() {
    // Small delay so datalist selection isn't treated as a blur
    setTimeout(() => { if (!value.trim()) close() }, 150)
  }

  if (!editing) {
    return (
      <button className="label-add-trigger" onClick={open}>+ Add label</button>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        className="label-chip-input"
        list={listId}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="label…"
        disabled={busy}
      />
      <datalist id={listId}>
        {allLabels.map(({ label }) => (
          <option key={label} value={label} />
        ))}
      </datalist>
    </>
  )
}

function StatusDropdown({ status, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <span ref={wrapRef} className={`badge badge-${status} status-dropdown-wrap`}>
      <button
        className="status-dropdown-trigger"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        <StatusIcon status={status} size={12} />
        <span>{status.replace('_', ' ')}</span>
        <ChevronDown size={10} strokeWidth={2} />
      </button>
      {open && (
        <div className="status-dropdown-menu">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              className={`status-dropdown-option${s === status ? ' is-current' : ''}`}
              onClick={() => { setOpen(false); onChange(s) }}
            >
              <StatusIcon status={s} size={11} />
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}

function CopyIdButton({ id }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      className="btn-copy-id"
      onClick={handleCopy}
      title="Copy issue ID"
      aria-label="Copy issue ID"
    >
      {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={1.75} />}
    </button>
  )
}

export default function IssueDetail({ issueId, onClose, onSelectIssue, onEdit }) {
  const { issue, loading, error } = useIssue(issueId)
  const { children } = useChildren(issueId)
  const { issue: parentIssue } = useIssue(issue?.parent ?? null)
  const [pendingClose, setPendingClose] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [actionPending, setActionPending] = useState(false)

  async function handleAction(fn, successMsg) {
    setActionPending(true)
    try {
      await fn()
      if (successMsg) toast(successMsg, 'success')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setActionPending(false)
    }
  }

  async function handleStatusChange(newStatus) {
    if (newStatus === issue.status) return
    if (newStatus === 'closed') {
      setPendingClose(true)
      return
    }
    await handleAction(() => updateIssue(issueId, { status: newStatus }), `Marked ${newStatus.replace('_', ' ')}`)
  }

  async function handleCloseConfirm() {
    await handleAction(
      () => closeIssue(issueId, closeReason || undefined),
      'Issue closed'
    )
    setPendingClose(false)
    setCloseReason('')
  }

  const canClaim = issue?.status === 'open'
  const canClose = issue?.status !== 'closed'

  useKeyboard({
    c: () => canClaim && !actionPending && handleAction(() => updateIssue(issueId, { claim: true }), 'Issue claimed'),
    e: () => issue && onEdit?.(issue),
    x: () => canClose && !pendingClose && setPendingClose(true),
  }, !!issue && !pendingClose)

  if (loading) return <div className="detail-loading">Loading…</div>
  if (error)   return <div className="detail-error">Error: {error}</div>
  if (!issue)  return null

  const blockedBy = issue.dependencies?.filter(d => d.dependency_type === 'blocks') ?? []

  return (
    <div className="issue-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-top">
          <div className="detail-id-group">
            {issue.parent && (
              <>
                <button
                  className="detail-id detail-parent-link"
                  onClick={() => onSelectIssue?.(issue.parent)}
                  title="Parent issue"
                >
                  {issue.parent}
                </button>
                <span className="detail-id detail-breadcrumb-sep">/</span>
              </>
            )}
            <span className="detail-id">{issue.id}</span>
            <CopyIdButton id={issue.id} />
          </div>
          <div className="detail-actions-top">
            {canClaim && (
              <button
                className="btn btn-secondary"
                disabled={actionPending}
                onClick={() => handleAction(() => updateIssue(issueId, { claim: true }), 'Issue claimed')}
              >
                Claim
              </button>
            )}
            {onEdit && (
              <button className="btn btn-secondary" onClick={() => onEdit(issue)}>
                Edit
              </button>
            )}
            <button className="btn btn-secondary detail-close-btn" onClick={onClose}><X size={14} /></button>
          </div>
        </div>
        <h2 className="detail-title">{issue.title}</h2>
      </div>

      {/* Meta row */}
      <div className="detail-meta">
        <StatusDropdown
          status={issue.status}
          onChange={handleStatusChange}
          disabled={actionPending}
        />
        {issue.priority !== undefined && (
          <span className={`priority-badge p${issue.priority}`}>
            {PRIORITY_LABEL[issue.priority]}
          </span>
        )}
        {issue.issue_type && (
          <span className="detail-type">{issue.issue_type}</span>
        )}
        {issue.assignee && (
          <span className="detail-assignee">
            <User size={12} strokeWidth={1.75} /> {issue.assignee}
          </span>
        )}
      </div>

      {((issue.estimated_minutes != null && issue.estimated_minutes > 0) || issue.due_at || issue.created_at) && (
        <div className="detail-kv-wrap">
          <dl className="detail-kv">
            {issue.estimated_minutes != null && issue.estimated_minutes > 0 && (
              <>
                <dt>Estimate</dt>
                <dd>{issue.estimated_minutes} min</dd>
              </>
            )}
            {issue.due_at && (
              <>
                <dt>Due</dt>
                <dd>{formatDate(issue.due_at)}</dd>
              </>
            )}
            {issue.created_at && (
              <>
                <dt>Created</dt>
                <dd>{formatDate(issue.created_at)}</dd>
              </>
            )}
          </dl>
        </div>
      )}

      {/* Labels */}
      {((issue.labels?.length > 0) || canClose) && (
        <div className="detail-section">
          <div className="detail-section-label">Labels</div>
          <div className="label-chips">
            {(issue.labels ?? []).map(label => (
              <LabelChip
                key={label}
                label={label}
                onRemove={canClose ? () => handleAction(() => removeLabel(issueId, label), null) : null}
              />
            ))}
            {canClose && <LabelAddTrigger issueId={issueId} />}
          </div>
        </div>
      )}

      {/* Close confirmation */}
      {pendingClose && (
        <div className="detail-section detail-actions-bottom">
          <div className="close-reason-row">
            <input
              autoFocus
              className="close-reason-input"
              placeholder="Close reason (optional)"
              value={closeReason}
              onChange={e => setCloseReason(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCloseConfirm()
                if (e.key === 'Escape') { setPendingClose(false); setCloseReason('') }
              }}
            />
            <button className="btn btn-danger" disabled={actionPending} onClick={handleCloseConfirm}>
              Close
            </button>
            <button className="btn btn-secondary" onClick={() => { setPendingClose(false); setCloseReason('') }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Description */}
      {issue.description && (
        <div className="detail-section">
          <div className="detail-section-label">Description</div>
          <MarkdownContent text={issue.description} className="detail-description" />
        </div>
      )}

      {/* Notes */}
      {issue.notes && (
        <div className="detail-section">
          <div className="detail-section-label">Notes</div>
          <MarkdownContent text={issue.notes} className="detail-description" />
        </div>
      )}

      {/* Design */}
      {issue.design && (
        <div className="detail-section">
          <div className="detail-section-label">Design</div>
          <MarkdownContent text={issue.design} className="detail-description" />
        </div>
      )}

      {/* Dependencies */}
      {blockedBy.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-label">Dependencies</div>
          <div className="dep-group">
            <span className="dep-group-label">Blocked by</span>
            <div className="dep-chips">
              {blockedBy.map(d => (
                <DepChip key={d.id} dep={d} onSelect={onSelectIssue ?? (() => {})} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parent */}
      {parentIssue && (
        <div className="detail-section">
          <div className="detail-section-label">Parent</div>
          <div className="dep-chips">
            <DepChip dep={parentIssue} onSelect={onSelectIssue ?? (() => {})} />
          </div>
        </div>
      )}

      {/* Children */}
      {children.length > 0 && (
        <div className="detail-section">
          <div className="detail-section-label">Children</div>
          <div className="dep-chips">
            {children.map(child => (
              <DepChip key={child.id} dep={child} onSelect={onSelectIssue ?? (() => {})} />
            ))}
          </div>
        </div>
      )}

      <CommentThread issueId={issueId} />
    </div>
  )
}
