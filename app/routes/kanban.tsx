import { useParams, useNavigate, useOutletContext } from 'react-router';
import KanbanView from '../views/KanbanView/index.jsx';
import type { LayoutOutletContext } from './_layout.jsx';

export default function KanbanRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { DetailPanel, onRefreshed } = useOutletContext<LayoutOutletContext>();

  return (
    <KanbanView
      selectedIssueId={id || null}
      onSelectIssue={(issueId) => navigate(issueId ? `/kanban/${issueId}` : '/kanban')}
      DetailPanel={DetailPanel}
      onRefreshed={onRefreshed}
    />
  );
}
