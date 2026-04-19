import { useState } from 'react';
import { useIssues } from '../../hooks/useIssues.js';
import IssueCard from '../../components/IssueCard.jsx';
import type { Issue } from '../../types.js';
import './KanbanView.css';

const COLUMNS = [
  { id: 'open', label: 'Open', status: 'open' },
  { id: 'in_progress', label: 'In Progress', status: 'in_progress' },
  { id: 'blocked', label: 'Blocked', status: 'blocked' },
  { id: 'done', label: 'Done', status: 'closed' },
];

interface KanbanColumnProps {
  column: (typeof COLUMNS)[number];
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
  hidden: boolean;
}

function KanbanColumn({
  column,
  issues,
  selectedIssueId,
  onSelectIssue,
  hidden,
}: KanbanColumnProps) {
  return (
    <div className={`kanban-col kanban-col-${column.id}${hidden ? ' kanban-col-hidden' : ''}`}>
      <div className="kanban-col-header">
        <span className="kanban-col-label">{column.label}</span>
        <span className="kanban-col-count">{issues.length}</span>
      </div>
      <div className="kanban-col-body">
        {issues.length === 0 && <div className="kanban-empty">No issues</div>}
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            selected={issue.id === selectedIssueId}
            onClick={() => onSelectIssue(issue.id === selectedIssueId ? null : issue.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface DetailPanelComponent {
  ({ issueId, onClose }: { issueId: string; onClose: () => void }): React.ReactElement;
}

interface KanbanViewProps {
  search: string;
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
  DetailPanel: DetailPanelComponent;
  onRefreshed: (date: Date) => void;
}

export default function KanbanView({
  search,
  selectedIssueId,
  onSelectIssue,
  DetailPanel,
  onRefreshed,
}: KanbanViewProps) {
  const [activeColumn, setActiveColumn] = useState('open');
  const { issues, loading, error } = useIssues({ search }, { onRefreshed });

  const byStatus: Record<string, Issue[]> = {};
  for (const col of COLUMNS) byStatus[col.status] = [];
  for (const issue of issues) {
    if (byStatus[issue.status]) byStatus[issue.status].push(issue);
  }

  return (
    <div className="kanban-view">
      <div className="kanban-col-picker">
        {COLUMNS.map((col) => (
          <button
            key={col.id}
            className={`pill ${activeColumn === col.id ? 'active' : ''}`}
            onClick={() => setActiveColumn(col.id)}
          >
            {col.label}
            {!loading && (byStatus[col.status]?.length ?? 0) > 0 && (
              <span className="kanban-picker-count">{byStatus[col.status].length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="kanban-board">
        {loading && <div className="kanban-state">Loading…</div>}
        {error && <div className="kanban-state kanban-error">Error: {error}</div>}
        {!loading &&
          !error &&
          COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              issues={byStatus[col.status]}
              selectedIssueId={selectedIssueId}
              onSelectIssue={onSelectIssue}
              hidden={activeColumn !== col.id}
            />
          ))}
      </div>

      {selectedIssueId && (
        <div className="kanban-detail">
          <DetailPanel issueId={selectedIssueId} onClose={() => onSelectIssue(null)} />
        </div>
      )}
    </div>
  );
}
