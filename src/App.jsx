import { useState, useCallback } from 'react'
import Header from './components/Header.jsx'
import IssueDetail from './components/IssueDetail.jsx'
import IssueModal from './components/IssueModal.jsx'
import ListView from './views/ListView.jsx'
import KanbanView from './views/KanbanView.jsx'

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

  const handleRefresh = useCallback(() => setDetailKey(k => k + 1), [])

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
      />

      <main className="main">
        {activeTab === 'list' && (
          <ListView
            search={search}
            selectedIssueId={selectedIssueId}
            onSelectIssue={setSelectedIssueId}
            DetailPanel={DetailPanel}
          />
        )}
        {activeTab === 'kanban' && (
          <KanbanView
            search={search}
            selectedIssueId={selectedIssueId}
            onSelectIssue={setSelectedIssueId}
            DetailPanel={DetailPanel}
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
    </div>
  )
}
