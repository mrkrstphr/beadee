import { useIssues } from '../hooks/useIssues.js'
import IssueCard from '../components/IssueCard.jsx'

const COLUMNS = [
  { id: 'open',        label: 'Open',        status: 'open' },
  { id: 'in_progress', label: 'In Progress', status: 'in_progress' },
  { id: 'blocked',     label: 'Blocked',     status: 'blocked' },
  { id: 'done',        label: 'Done',        status: 'closed' },
]

function KanbanColumn({ column, issues, selectedIssueId, onSelectIssue }) {
  return (
    <div className={`kanban-col kanban-col-${column.id}`}>
      <div className="kanban-col-header">
        <span className="kanban-col-label">{column.label}</span>
        <span className="kanban-col-count">{issues.length}</span>
      </div>
      <div className="kanban-col-body">
        {issues.length === 0 && (
          <div className="kanban-empty">No issues</div>
        )}
        {issues.map(issue => (
          <IssueCard
            key={issue.id}
            issue={issue}
            selected={issue.id === selectedIssueId}
            onClick={() => onSelectIssue(issue.id === selectedIssueId ? null : issue.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default function KanbanView({ search, selectedIssueId, onSelectIssue, DetailPanel, onRefreshed }) {
  const { issues, loading, error } = useIssues({ search }, { onRefreshed })

  const byStatus = {}
  for (const col of COLUMNS) byStatus[col.status] = []
  for (const issue of issues) {
    if (byStatus[issue.status]) byStatus[issue.status].push(issue)
  }

  return (
    <div className="kanban-view">
      <div className="kanban-board">
        {loading && <div className="kanban-state">Loading…</div>}
        {error   && <div className="kanban-state kanban-error">Error: {error}</div>}
        {!loading && !error && COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            issues={byStatus[col.status]}
            selectedIssueId={selectedIssueId}
            onSelectIssue={onSelectIssue}
          />
        ))}
      </div>

      {selectedIssueId && (
        <div className="kanban-detail">
          <DetailPanel
            issueId={selectedIssueId}
            onClose={() => onSelectIssue(null)}
          />
        </div>
      )}
    </div>
  )
}
