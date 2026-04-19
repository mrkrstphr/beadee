import { createContext, useContext, useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import Header from '../components/Header/index.jsx';
import IssueDetail from '../components/IssueDetail/index.jsx';
import IssueModal from '../components/IssueModal.jsx';
import ErrorScreen from '../components/ErrorScreen/index.jsx';
import ToastContainer from '../components/ToastContainer/index.jsx';
import ShortcutsHelp from '../components/ShortcutsHelp/index.jsx';
import SearchPalette from '../components/SearchPalette/index.jsx';
import Footer from '../components/Footer/index.jsx';
import { useHealth } from '../hooks/useIssues.js';
import { ToastContext, useToastProvider } from '../hooks/useToast.js';
import { useKeyboard } from '../hooks/useKeyboard.js';
import type { Issue } from '../types.js';

function applyTheme(theme: string) {
  localStorage.setItem('beadee-theme', theme);
  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

interface DetailPanelCtx {
  onSelectIssue: (id: string) => void;
  onEdit: (issue: Issue) => void;
  onDelete: () => void;
}

const DetailPanelContext = createContext<DetailPanelCtx | null>(null);

interface DetailPanelProps {
  issueId: string;
  onClose: () => void;
}

function DetailPanel({ issueId, onClose }: DetailPanelProps) {
  const ctx = useContext(DetailPanelContext)!;
  return (
    <IssueDetail
      issueId={issueId}
      onClose={onClose}
      onSelectIssue={ctx.onSelectIssue}
      onEdit={ctx.onEdit}
      onDelete={ctx.onDelete}
    />
  );
}

export interface LayoutOutletContext {
  DetailPanel: (props: DetailPanelProps) => React.ReactElement;
  onRefreshed: (date: Date) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [theme, setTheme] = useState(
    () => (typeof window !== 'undefined' ? localStorage.getItem('beadee-theme') : null) || 'dark',
  );
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSearchPalette, setShowSearchPalette] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [polling, setPolling] = useState(false);

  const queryClient = useQueryClient();
  const { health, error: healthError, loading: healthLoading } = useHealth();
  const toastValue = useToastProvider();

  const activeTab = location.pathname.startsWith('/kanban')
    ? 'kanban'
    : location.pathname.startsWith('/settings')
      ? 'settings'
      : location.pathname.startsWith('/memories')
        ? 'memories'
        : 'list';

  const handleRefreshed = useCallback((date: Date) => {
    setLastUpdated(date);
    setPolling(false);
  }, []);

  const handleForceRefresh = useCallback(() => {
    void queryClient.invalidateQueries();
  }, [queryClient]);

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
    setTheme(t);
    applyTheme(t);
  }

  const openEdit = useCallback((issue: Issue) => {
    setEditingIssue(issue);
    setShowModal(true);
  }, []);

  function handleModalSaved(saved: Issue, { created }: { created?: boolean } = {}) {
    if (created && saved?.id) {
      const view = activeTab === 'settings' ? 'list' : activeTab;
      navigate(`/${view}/${saved.id}`);
    }
    setShowModal(false);
    setEditingIssue(null);
  }

  const modalOpen = showModal || showShortcuts || showSearchPalette;

  const handleDelete = useCallback(() => {
    navigate(`/${activeTab}`);
  }, [activeTab, navigate]);

  useKeyboard(
    {
      n: () => {
        setEditingIssue(null);
        setShowModal(true);
      },
      f: () => setShowSearchPalette(true),
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

  if (healthLoading) return null;
  if (healthError) return <ErrorScreen error={healthError} />;

  return (
    <ToastContext.Provider value={toastValue}>
      <DetailPanelContext.Provider
        value={{
          onSelectIssue: showIssueDetail,
          onEdit: openEdit,
          onDelete: handleDelete,
        }}
      >
        <div className="app">
          <Header
            activeTab={activeTab}
            onTabChange={switchTab}
            onOpenSearch={() => setShowSearchPalette(true)}
            onNewIssue={() => {
              setEditingIssue(null);
              setShowModal(true);
            }}
            lastUpdated={lastUpdated}
            polling={polling}
            projectName={health?.projectName}
            onRefresh={handleForceRefresh}
          />

          <main className="main">
            <Outlet
              context={
                {
                  DetailPanel,
                  onRefreshed: handleRefreshed,
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

          {showSearchPalette && (
            <SearchPalette onClose={() => setShowSearchPalette(false)} onSelect={showIssueDetail} />
          )}

          <ToastContainer />
        </div>
      </DetailPanelContext.Provider>
    </ToastContext.Provider>
  );
}
