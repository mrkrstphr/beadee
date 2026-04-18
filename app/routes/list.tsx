import { useParams, useNavigate, useOutletContext } from 'react-router';
import ListView from '../views/ListView.jsx';
import type { LayoutOutletContext } from './_layout.jsx';

export default function ListRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search, DetailPanel, onRefreshed } = useOutletContext<LayoutOutletContext>();

  return (
    <ListView
      search={search}
      selectedIssueId={id || null}
      onSelectIssue={(issueId) => navigate(issueId ? `/list/${issueId}` : '/list')}
      DetailPanel={DetailPanel}
      onRefreshed={onRefreshed}
    />
  );
}
