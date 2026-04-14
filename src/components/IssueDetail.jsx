import { useState } from 'react'
import { useIssue, updateIssue, closeIssue } from '../hooks/useIssues.js'
import { toast } from '../hooks/useToast.js'
import { useKeyboard } from '../hooks/useKeyboard.js'
import CommentThread from './CommentThread.jsx'

const STATUS_ICON = {
  open:        '○',
  in_progress: '◑',
  blocked:     '●',
  closed:      '✓',
  deferred:    '❄',
}

const PRIORITY_LABEL = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' }

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function DepChip({ dep, onSelect }) {
  return (
    <button className="dep-chip" onClick={() => onSelect(dep.id)} title={dep.title}>
      <span className={`dep-chip-icon status-icon-${dep.status}`}>
        {STATUS_ICON[dep.status] ?? '○'}
      </span>
      <span className="dep-chip-id">{dep.id}</span>
      <span className="dep-chip-title">{dep.title}</span>
    </button>
  )
}

export default function IssueDetail({ issueId, onClose, onSelectIssue, onEdit, onRefresh }) {
  const { issue, loading, error } = useIssue(issueId)
  const [closing, setClosing] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [actionPending, setActionPending] = useState(false)

  async function handleAction(fn, successMsg) {
    setActionPending(true)
    try {
      await fn()
      onRefresh?.()
      if (successMsg) toast(successMsg, 'success')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setActionPending(false)
    }
  }

  async function handleClose() {
    if (!closing) { setClosing(true); return }
    await handleAction(
      () => closeIssue(issueId, closeReason || undefined),
      'Issue closed'
    )
    setClosing(false)
    setCloseReason('')
  }

  // Derive action availability from current issue status (safe before early returns)
  const canClaim      = issue?.status === 'open'
  const canInProgress = issue?.status === 'open' || issue?.status === 'blocked'
  const canBlock      = issue?.status === 'in_progress' || issue?.status === 'open'
  const canClose      = issue?.status !== 'closed'

  useKeyboard({
    c: () => canClaim  && !actionPending && handleAction(() => updateIssue(issueId, { claim: true }), 'Issue claimed'),
    e: () => issue && onEdit?.(issue),
    x: () => canClose  && !closing && setClosing(true),
  }, !!issue && !closing)

  if (loading) return <div className="detail-loading">Loading…</div>
  if (error)   return <div className="detail-error">Error: {error}</div>
  if (!issue)  return null

  const blockedBy = issue.dependencies?.filter(d => d.dependency_type === 'blocks') ?? []
  const blocking  = issue.dependencies?.filter(d => d.dependency_type !== 'blocks') ?? []

  return (
    <div className="issue-detail">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-top">
          <span className="detail-id">{issue.id}</span>
          <div className="detail-actions-top">
            {onEdit && (
              <button className="btn btn-secondary" onClick={() => onEdit(issue)}>
                Edit
              </button>
            )}
            <button className="btn btn-secondary detail-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <h2 className="detail-title">{issue.title}</h2>
      </div>

      {/* Meta row */}
      <div className="detail-meta">
        <span className={`badge badge-${issue.status}`}>
          {STATUS_ICON[issue.status]} {issue.status?.replace('_', ' ')}
        </span>
        {issue.priority !== undefined && (
          <span className={`priority-badge p${issue.priority}`}>
            {PRIORITY_LABEL[issue.priority]}
          </span>
        )}
        {issue.issue_type && (
          <span className="detail-type">{issue.issue_type}</span>
        )}
        {issue.assignee && (
          <span className="detail-assignee">👤 {issue.assignee}</span>
        )}
        {issue.created_at && (
          <span className="detail-date">Created {formatDate(issue.created_at)}</span>
        )}
      </div>

      {/* Description */}
      {issue.description && (
        <div className="detail-section">
          <div className="detail-section-label">Description</div>
          <div className="detail-description">{issue.description}</div>
        </div>
      )}

      {/* Notes */}
      {issue.notes && (
        <div className="detail-section">
          <div className="detail-section-label">Notes</div>
          <div className="detail-description">{issue.notes}</div>
        </div>
      )}

      {/* Design */}
      {issue.design && (
        <div className="detail-section">
          <div className="detail-section-label">Design</div>
          <div className="detail-description">{issue.design}</div>
        </div>
      )}

      {/* Dependencies */}
      {(blockedBy.length > 0 || blocking.length > 0) && (
        <div className="detail-section">
          <div className="detail-section-label">Dependencies</div>
          {blockedBy.length > 0 && (
            <div className="dep-group">
              <span className="dep-group-label">Blocked by</span>
              <div className="dep-chips">
                {blockedBy.map(d => (
                  <DepChip key={d.id} dep={d} onSelect={onSelectIssue ?? (() => {})} />
                ))}
              </div>
            </div>
          )}
          {blocking.length > 0 && (
            <div className="dep-group">
              <span className="dep-group-label">Blocking</span>
              <div className="dep-chips">
                {blocking.map(d => (
                  <DepChip key={d.id} dep={d} onSelect={onSelectIssue ?? (() => {})} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {canClose && (
        <div className="detail-section detail-actions-bottom">
          <div className="detail-section-label">Actions</div>
          <div className="detail-btn-row">
            {canClaim && (
              <button
                className="btn btn-secondary"
                disabled={actionPending}
                onClick={() => handleAction(() => updateIssue(issueId, { claim: true }), 'Issue claimed')}
              >
                Claim
              </button>
            )}
            {canInProgress && (
              <button
                className="btn btn-secondary"
                disabled={actionPending}
                onClick={() => handleAction(() => updateIssue(issueId, { status: 'in_progress' }), 'Marked in progress')}
              >
                Mark In Progress
              </button>
            )}
            {canBlock && (
              <button
                className="btn btn-secondary"
                disabled={actionPending}
                onClick={() => handleAction(() => updateIssue(issueId, { status: 'blocked' }), 'Marked blocked')}
              >
                Mark Blocked
              </button>
            )}
            <button
              className="btn btn-danger"
              disabled={actionPending}
              onClick={handleClose}
            >
              {closing ? 'Confirm Close' : 'Close Issue'}
            </button>
          </div>
          {closing && (
            <div className="close-reason-row">
              <input
                autoFocus
                className="close-reason-input"
                placeholder="Reason (optional)"
                value={closeReason}
                onChange={e => setCloseReason(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleClose(); if (e.key === 'Escape') setClosing(false) }}
              />
              <button className="btn btn-secondary" onClick={() => setClosing(false)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      <CommentThread issueId={issueId} />
    </div>
  )
}
