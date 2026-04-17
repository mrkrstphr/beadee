import { useParams, useNavigate, useOutletContext } from 'react-router'
import KanbanView from '../../src/views/KanbanView.jsx'

export default function KanbanRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { search, DetailPanel, onRefreshed } = useOutletContext()

  return (
    <KanbanView
      search={search}
      selectedIssueId={id || null}
      onSelectIssue={(issueId) => navigate(issueId ? `/kanban/${issueId}` : '/kanban')}
      DetailPanel={DetailPanel}
      onRefreshed={onRefreshed}
    />
  )
}
