import { useParams, useNavigate, useOutletContext } from 'react-router';
import KanbanView from '../views/KanbanView.jsx';
import type { LayoutOutletContext } from './_layout.jsx';

export default function KanbanIdRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search, DetailPanel, onRefreshed } = useOutletContext<LayoutOutletContext>();

  return (
    <KanbanView
      search={search}
      selectedIssueId={id || null}
      onSelectIssue={(issueId) => navigate(issueId ? `/kanban/${issueId}` : '/kanban')}
      DetailPanel={DetailPanel}
      onRefreshed={onRefreshed}
    />
  );
}
