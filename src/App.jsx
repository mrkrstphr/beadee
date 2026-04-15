import { useState, useCallback } from 'react'
import Header from './components/Header.jsx'
import IssueDetail from './components/IssueDetail.jsx'
import IssueModal from './components/IssueModal.jsx'
import ErrorScreen from './components/ErrorScreen.jsx'
import ToastContainer from './components/ToastContainer.jsx'
import ListView from './views/ListView.jsx'
import KanbanView from './views/KanbanView.jsx'
import { useHealth } from './hooks/useIssues.js'
import { useToastProvider } from './hooks/useToast.js'

function setTheme(theme) {
  localStorage.setItem('beadee-theme', theme)
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'
  } else {
    document.documentElement.dataset.theme = theme
  }
}

export default function App() {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('beadee-theme') || 'dark'
  )
  const [activeTab, setActiveTab] = useState('list')
  const [selectedIssueId, setSelectedIssueId] = useState(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingIssue, setEditingIssue] = useState(null)
  const [detailKey, setDetailKey] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [polling, setPolling] = useState(false)

  const { health, error: healthError } = useHealth()
  const { toasts, dismiss } = useToastProvider()

  const handleRefresh = useCallback(() => setDetailKey(k => k + 1), [])

  const handleRefreshed = useCallback((date) => {
    setLastUpdated(date)
    setPolling(false)
  }, [])

  function handleThemeChange(t) {
    setThemeState(t)
    setTheme(t)
  }

  function openEdit(issue) {
    setEditingIssue(issue)
    setShowModal(true)
  }

  function handleModalSaved() {
    handleRefresh()
    setShowModal(false)
    setEditingIssue(null)
  }

  const DetailPanel = useCallback(({ issueId, onClose }) => (
    <IssueDetail
      key={`${issueId}-${detailKey}`}
      issueId={issueId}
      onClose={onClose}
      onSelectIssue={setSelectedIssueId}
      onEdit={openEdit}
      onRefresh={handleRefresh}
    />
  ), [detailKey])

  if (healthError) return <ErrorScreen error={healthError} />

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        onTabChange={tab => { setActiveTab(tab); setSelectedIssueId(null) }}
        search={search}
        onSearchChange={setSearch}
        onNewIssue={() => { setEditingIssue(null); setShowModal(true) }}
        theme={theme}
        onThemeChange={handleThemeChange}
        lastUpdated={lastUpdated}
        polling={polling}
      />

      <main className="main">
        {activeTab === 'list' && (
          <ListView
            search={search}
            selectedIssueId={selectedIssueId}
            onSelectIssue={setSelectedIssueId}
            DetailPanel={DetailPanel}
            onRefreshed={handleRefreshed}
          />
        )}
        {activeTab === 'kanban' && (
          <KanbanView
            search={search}
            selectedIssueId={selectedIssueId}
            onSelectIssue={setSelectedIssueId}
            DetailPanel={DetailPanel}
            onRefreshed={handleRefreshed}
          />
        )}
      </main>

      {showModal && (
        <IssueModal
          issue={editingIssue}
          onClose={() => { setShowModal(false); setEditingIssue(null) }}
          onSaved={handleModalSaved}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
