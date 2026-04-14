import { useState } from 'react'
import Header from './components/Header.jsx'
import ListView from './views/ListView.jsx'

function setTheme(theme) {
  localStorage.setItem('beadee-theme', theme)
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'
  } else {
    document.documentElement.dataset.theme = theme
  }
}

function DetailPlaceholder({ issueId, onClose }) {
  return (
    <div style={{ padding: '24px' }}>
      <button className="btn btn-secondary" onClick={onClose} style={{ marginBottom: 16 }}>← Back</button>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        Detail panel coming soon for <strong>{issueId}</strong>
      </p>
    </div>
  )
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

  function handleThemeChange(t) {
    setThemeState(t)
    setTheme(t)
  }

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
            DetailPanel={DetailPlaceholder}
          />
        )}
        {activeTab === 'kanban' && (
          <div className="placeholder">
            <p className="placeholder-title">Board view coming soon</p>
          </div>
        )}
      </main>
    </div>
  )
}
