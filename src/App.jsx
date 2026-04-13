import { useState } from 'react'
import Header from './components/Header.jsx'

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
        <div className="placeholder">
          <p className="placeholder-title">beadee is running</p>
          <p className="placeholder-sub">
            Views coming soon — active tab: <strong>{activeTab}</strong>
            {search && <> · search: <strong>{search}</strong></>}
          </p>
        </div>
      </main>
    </div>
  )
}
