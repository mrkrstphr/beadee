import { useState, useCallback } from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router'
import Header from '../../src/components/Header.jsx'
import IssueDetail from '../../src/components/IssueDetail.jsx'
import IssueModal from '../../src/components/IssueModal.jsx'
import ErrorScreen from '../../src/components/ErrorScreen.jsx'
import ToastContainer from '../../src/components/ToastContainer.jsx'
import ShortcutsHelp from '../../src/components/ShortcutsHelp.jsx'
import Footer from '../../src/components/Footer.jsx'
import { useHealth } from '../../src/hooks/useIssues.js'
import { useToastProvider } from '../../src/hooks/useToast.js'
import { useKeyboard } from '../../src/hooks/useKeyboard.js'

function setTheme(theme) {
  localStorage.setItem('beadee-theme', theme)
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'
  } else {
    document.documentElement.dataset.theme = theme
  }
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()

  const [theme, setThemeState] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('beadee-theme') : null) || 'dark'
  )
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingIssue, setEditingIssue] = useState(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [detailKey, setDetailKey] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [polling, setPolling] = useState(false)

  const { health, error: healthError } = useHealth()
  const { toasts, dismiss } = useToastProvider()

  // Derive active tab from pathname
  const activeTab = location.pathname.startsWith('/kanban') ? 'kanban'
    : location.pathname.startsWith('/settings') ? 'settings'
    : 'list'

  const handleRefresh = useCallback(() => setDetailKey(k => k + 1), [])
  const handleRefreshed = useCallback((date) => { setLastUpdated(date); setPolling(false) }, [])

  function switchTab(tab) {
    navigate(`/${tab}`)
  }

  function showIssueDetail(issueId) {
    const view = activeTab === 'settings' ? 'list' : activeTab
    navigate(`/${view}/${issueId}`)
  }

  function handleThemeChange(t) {
    setThemeState(t)
    setTheme(t)
  }

  function openEdit(issue) {
    setEditingIssue(issue)
    setShowModal(true)
  }

  function handleModalSaved(saved, { created } = {}) {
    handleRefresh()
    if (created && saved?.id) {
      const view = activeTab === 'settings' ? 'list' : activeTab
      navigate(`/${view}/${saved.id}`)
    }
    setShowModal(false)
    setEditingIssue(null)
  }

  const modalOpen = showModal || showShortcuts

  useKeyboard({
    'n': () => { setEditingIssue(null); setShowModal(true) },
    '/': () => { const el = document.querySelector('.header-search'); el?.focus() },
    'r': () => handleRefresh(),
    '1': () => switchTab('list'),
    '2': () => switchTab('kanban'),
    '?': () => setShowShortcuts(true),
    's': () => switchTab('settings'),
    'Escape': () => {
      if (activeTab === 'settings') navigate('/list')
      else if (id) navigate(`/${activeTab}`)
    },
  }, !modalOpen)

  const DetailPanel = useCallback(({ issueId, onClose }) => (
    <IssueDetail
      key={`${issueId}-${detailKey}`}
      issueId={issueId}
      onClose={onClose}
      onSelectIssue={showIssueDetail}
      onEdit={openEdit}
      onRefresh={handleRefresh}
    />
  ), [detailKey, activeTab])

  if (healthError) return <ErrorScreen error={healthError} />

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        onTabChange={switchTab}
        search={search}
        onSearchChange={setSearch}
        onNewIssue={() => { setEditingIssue(null); setShowModal(true) }}
        lastUpdated={lastUpdated}
        polling={polling}
      />

      <main className="main">
        <Outlet context={{ search, DetailPanel, onRefreshed: handleRefreshed, onRefresh: handleRefresh, theme, onThemeChange: handleThemeChange }} />
      </main>

      <Footer onShowShortcuts={() => setShowShortcuts(true)} />

      {showModal && (
        <IssueModal
          issue={editingIssue}
          onClose={() => { setShowModal(false); setEditingIssue(null) }}
          onSaved={handleModalSaved}
        />
      )}

      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
