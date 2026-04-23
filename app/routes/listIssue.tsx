import { useNavigate, useOutletContext, useParams } from 'react-router';
import ListView from '../views/ListView/index.js';
import type { LayoutOutletContext } from './_layout.js';

export default function ListIdRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { DetailPanel, onRefreshed } = useOutletContext<LayoutOutletContext>();

  return (
    <ListView
      selectedIssueId={id || null}
      onSelectIssue={(issueId) => navigate(issueId ? `/list/${issueId}` : '/list')}
      DetailPanel={DetailPanel}
      onRefreshed={onRefreshed}
    />
  );
}
