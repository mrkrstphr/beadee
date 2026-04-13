import { useState } from 'react'

const THEMES = ['dark', 'light', 'dracula', 'synthwave', 'hacker', 'auto']

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
  const [filters, setFilters] = useState({ status: '', type: '' })
  const [showModal, setShowModal] = useState(false)
  const [editingIssue, setEditingIssue] = useState(null)

  function handleThemeChange(t) {
    setThemeState(t)
    setTheme(t)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">beadee</span>
          <nav className="tabs">
            <button
              className={`tab ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              List
            </button>
            <button
              className={`tab ${activeTab === 'kanban' ? 'active' : ''}`}
              onClick={() => setActiveTab('kanban')}
            >
              Kanban
            </button>
          </nav>
        </div>
        <div className="header-right">
          <select
            className="theme-select"
            value={theme}
            onChange={e => handleThemeChange(e.target.value)}
          >
            {THEMES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Issue
          </button>
        </div>
      </header>

      <main className="main">
        <div className="placeholder">
          <p className="placeholder-title">beadee is running</p>
          <p className="placeholder-sub">
            Views coming soon — active tab: <strong>{activeTab}</strong>
          </p>
        </div>
      </main>
    </div>
  )
}
