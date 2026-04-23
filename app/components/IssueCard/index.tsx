import { PRIORITY_LABEL, TYPE_SHORT } from '../../constants.js';
import { useEpicStatuses } from '../../hooks/api/useEpicStatuses.js';
import './IssueCard.css';
import type { EpicStatus, Issue } from '../../types.js';

function initials(name: string): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface IssueCardProps {
  issue: Issue;
  selected: boolean;
  onClick: () => void;
}

export default function IssueCard({ issue, selected, onClick }: IssueCardProps) {
  const epicStatuses = useEpicStatuses();
  const epicStatus: EpicStatus | undefined =
    issue.issue_type === 'epic' ? epicStatuses.get(issue.id) : undefined;

  const showProgress = epicStatus && epicStatus.total_children > 0;
  const progressPct = showProgress
    ? Math.round((epicStatus.closed_children / epicStatus.total_children) * 100)
    : 0;

  return (
    <button className={`issue-card ${selected ? 'selected' : ''}`} onClick={onClick}>
      <div className="issue-card-top">
        <span className={`priority-badge p${issue.priority ?? 2}`}>
          {PRIORITY_LABEL[issue.priority] ?? 'P2'}
        </span>
        {issue.issue_type && (
          <span className={`badge-type type-${issue.issue_type}`}>
            {TYPE_SHORT[issue.issue_type] ?? issue.issue_type.toUpperCase()}
          </span>
        )}
        {showProgress && (
          <span
            className="epic-progress-badge"
            title={`${epicStatus.closed_children}/${epicStatus.total_children} children closed`}
          >
            <span className="epic-progress-fill" style={{ width: `${progressPct}%` }} />
            <span className="epic-progress-text">
              {epicStatus.closed_children}/{epicStatus.total_children}
            </span>
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
  );
}
