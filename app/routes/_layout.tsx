import { useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';
import Header from '../components/Header.jsx';
import IssueDetail from '../components/IssueDetail.jsx';
import IssueModal from '../components/IssueModal.jsx';
import ErrorScreen from '../components/ErrorScreen.jsx';
import ToastContainer from '../components/ToastContainer.jsx';
import ShortcutsHelp from '../components/ShortcutsHelp.jsx';
import Footer from '../components/Footer.jsx';
import { useHealth } from '../hooks/useIssues.js';
import { useToastProvider } from '../hooks/useToast.js';
import { useKeyboard } from '../hooks/useKeyboard.js';
import type { Issue } from '../types.js';

function setTheme(theme: string) {
  localStorage.setItem('beadee-theme', theme);
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

interface DetailPanelProps {
  issueId: string;
  onClose: () => void;
}

export interface LayoutOutletContext {
  search: string;
  DetailPanel: (props: DetailPanelProps) => React.ReactElement;
  onRefreshed: (date: Date) => void;
  onRefresh: () => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [theme, setThemeState] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('beadee-theme') : null) || 'dark',
  );
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [detailKey, setDetailKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [polling, setPolling] = useState(false);

  const { health, error: healthError, loading: healthLoading } = useHealth();
  const { toasts, dismiss } = useToastProvider();

  const activeTab = location.pathname.startsWith('/kanban')
    ? 'kanban'
    : location.pathname.startsWith('/settings')
      ? 'settings'
      : location.pathname.startsWith('/memories')
        ? 'memories'
        : 'list';

  const handleRefresh = useCallback(() => setDetailKey((k) => k + 1), []);
  const handleRefreshed = useCallback((date: Date) => {
    setLastUpdated(date);
    setPolling(false);
  }, []);

  function switchTab(tab: string) {
    navigate(`/${tab}`);
  }

  const showIssueDetail = useCallback(
    (issueId: string) => {
      const view = activeTab === 'settings' || activeTab === 'memories' ? 'list' : activeTab;
      navigate(`/${view}/${issueId}`);
    },
    [activeTab, navigate],
  );

  function handleThemeChange(t: string) {
    setThemeState(t);
    setTheme(t);
  }

  const openEdit = useCallback((issue: Issue) => {
    setEditingIssue(issue);
    setShowModal(true);
  }, []);

  function handleModalSaved(saved: Issue, { created }: { created?: boolean } = {}) {
    handleRefresh();
    if (created && saved?.id) {
      const view = activeTab === 'settings' ? 'list' : activeTab;
      navigate(`/${view}/${saved.id}`);
    }
    setShowModal(false);
    setEditingIssue(null);
  }

  const modalOpen = showModal || showShortcuts;

  const handleDelete = useCallback(() => {
    navigate(`/${activeTab}`);
  }, [activeTab, navigate]);

  useKeyboard(
    {
      n: () => {
        setEditingIssue(null);
        setShowModal(true);
      },
      '/': () => {
        const el = document.querySelector('.header-search') as HTMLElement | null;
        el?.focus();
      },
      r: () => handleRefresh(),
      1: () => switchTab('list'),
      2: () => switchTab('kanban'),
      '?': () => setShowShortcuts(true),
      s: () => switchTab('settings'),
      m: () => switchTab('memories'),
      Escape: () => {
        if (activeTab === 'settings' || activeTab === 'memories') navigate('/list');
        else if (id) navigate(`/${activeTab}`);
      },
    },
    !modalOpen,
  );

  const DetailPanel = useCallback(
    ({ issueId, onClose }: DetailPanelProps) => (
      <IssueDetail
        key={`${issueId}-${detailKey}`}
        issueId={issueId}
        onClose={onClose}
        onSelectIssue={showIssueDetail}
        onEdit={openEdit}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
      />
    ),
    [detailKey, showIssueDetail, openEdit, handleDelete, handleRefresh],
  );

  if (healthLoading) return null;
  if (healthError) return <ErrorScreen error={healthError} />;

  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        onTabChange={switchTab}
        search={search}
        onSearchChange={setSearch}
        onNewIssue={() => {
          setEditingIssue(null);
          setShowModal(true);
        }}
        lastUpdated={lastUpdated}
        polling={polling}
        projectName={health?.projectName}
      />

      <main className="main">
        <Outlet
          context={
            {
              search,
              DetailPanel,
              onRefreshed: handleRefreshed,
              onRefresh: handleRefresh,
              theme,
              onThemeChange: handleThemeChange,
            } satisfies LayoutOutletContext
          }
        />
      </main>

      <Footer onShowShortcuts={() => setShowShortcuts(true)} />

      {showModal && (
        <IssueModal
          issue={editingIssue}
          onClose={() => {
            setShowModal(false);
            setEditingIssue(null);
          }}
          onSaved={handleModalSaved}
        />
      )}

      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
