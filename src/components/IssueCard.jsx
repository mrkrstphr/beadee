const PRIORITY_LABEL = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' }

const TYPE_SHORT = {
  bug: 'BUG', feature: 'FEAT', task: 'TASK', chore: 'CHR',
  epic: 'EPIC', spike: 'SPK', story: 'STR', decision: 'DEC', milestone: 'MS',
}

function initials(name) {
  if (!name) return '?'
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function IssueCard({ issue, selected, onClick }) {
  return (
    <button
      className={`issue-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="issue-card-top">
        <span className={`priority-badge p${issue.priority ?? 2}`}>
          {PRIORITY_LABEL[issue.priority] ?? 'P2'}
        </span>
        {issue.issue_type && (
          <span className={`badge-type type-${issue.issue_type}`}>
            {TYPE_SHORT[issue.issue_type] ?? issue.issue_type.toUpperCase()}
          </span>
        )}
        {issue.assignee && (
          <span className="card-avatar" title={issue.assignee}>
            {initials(issue.assignee)}
          </span>
        )}
      </div>
      <div className="issue-card-title">{issue.title}</div>
      <div className="issue-card-id">{issue.id}</div>
    </button>
  )
}
