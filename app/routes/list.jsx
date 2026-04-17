import { useParams, useNavigate, useOutletContext } from 'react-router'
import ListView from '../../src/views/ListView.jsx'

export default function ListRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { search, DetailPanel, onRefreshed } = useOutletContext()

  return (
    <ListView
      search={search}
      selectedIssueId={id || null}
      onSelectIssue={(issueId) => navigate(issueId ? `/list/${issueId}` : '/list')}
      DetailPanel={DetailPanel}
      onRefreshed={onRefreshed}
    />
  )
}
