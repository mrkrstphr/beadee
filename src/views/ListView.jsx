import { useState } from 'react'
import { useIssues } from '../hooks/useIssues.js'

const STATUS_FILTERS = [
  { label: 'All',         value: '' },
  { label: 'Open',        value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Blocked',     value: 'blocked' },
  { label: 'Closed',      value: 'closed' },
]

const TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Bug',       value: 'bug' },
  { label: 'Feature',   value: 'feature' },
  { label: 'Task',      value: 'task' },
  { label: 'Chore',     value: 'chore' },
  { label: 'Epic',      value: 'epic' },
  { label: 'Spike',     value: 'spike' },
  { label: 'Story',     value: 'story' },
]

const STATUS_ICON = {
  open:        '○',
  in_progress: '◑',
  blocked:     '●',
  closed:      '✓',
  deferred:    '❄',
  pinned:      '📌',
}

const TYPE_SHORT = {
  bug:       'BUG',
  feature:   'FEAT',
  task:      'TASK',
  chore:     'CHR',
  epic:      'EPIC',
  spike:     'SPK',
  story:     'STR',
  decision:  'DEC',
  milestone: 'MS',
}

const PRIORITY_LABEL = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' }

function IssueRow({ issue, selected, onClick }) {
  return (
    <button
      className={`issue-row ${selected ? 'selected' : ''} status-${issue.status}`}
      onClick={onClick}
    >
      <span className={`issue-row-icon status-icon-${issue.status}`}>
        {STATUS_ICON[issue.status] ?? '○'}
      </span>
      <span className="issue-row-body">
        <span className="issue-row-title">{issue.title}</span>
        <span className="issue-row-meta">
          <span className="issue-row-id">{issue.id}</span>
          {issue.issue_type && (
            <span className={`badge-type type-${issue.issue_type}`}>
              {TYPE_SHORT[issue.issue_type] ?? issue.issue_type.toUpperCase()}
            </span>
          )}
        </span>
      </span>
      <span className={`priority-badge p${issue.priority ?? 2}`}>
        {PRIORITY_LABEL[issue.priority] ?? 'P2'}
      </span>
    </button>
  )
}

function SkeletonRow() {
  return (
    <div className="issue-row skeleton-row">
      <span className="skeleton skeleton-icon" />
      <span className="issue-row-body">
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-meta" />
      </span>
      <span className="skeleton skeleton-badge" />
    </div>
  )
}

export default function ListView({ search, selectedIssueId, onSelectIssue, DetailPanel, onRefreshed }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { issues, loading, error } = useIssues({
    status: statusFilter,
    type: typeFilter,
    search,
  }, { onRefreshed })

  return (
    <div className="list-view">
      {/* ── Left panel ─────────────────────────────────────────── */}
      <div className="list-panel">
        <div className="list-panel-toolbar">
          <div className="status-pills">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                className={`pill ${statusFilter === f.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="list-panel-footer-row">
            <select
              className="type-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="issue-count">
              {loading ? '…' : `${issues.length} issue${issues.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        <div className="issue-list">
          {loading && [1,2,3,4].map(i => <SkeletonRow key={i} />)}
          {error && <div className="list-state list-error">Error: {error}</div>}
          {!loading && !error && issues.length === 0 && (
            <div className="list-state list-empty">
              {search || statusFilter || typeFilter
                ? 'No issues match your filters'
                : 'No issues yet'}
            </div>
          )}
          {issues.map(issue => (
            <IssueRow
              key={issue.id}
              issue={issue}
              selected={issue.id === selectedIssueId}
              onClick={() => onSelectIssue(issue.id === selectedIssueId ? null : issue.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────── */}
      <div className="detail-panel">
        {selectedIssueId
          ? <DetailPanel issueId={selectedIssueId} onClose={() => onSelectIssue(null)} />
          : (
            <div className="detail-empty">
              <span className="detail-empty-icon">○</span>
              <p>Select an issue to view details</p>
            </div>
          )
        }
      </div>
    </div>
  )
}
