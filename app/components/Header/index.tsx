import { Settings, Search } from 'lucide-react';
import RefreshIndicator from '../RefreshIndicator/index.jsx';
import './Header.css';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSearch: () => void;
  onNewIssue: () => void;
  lastUpdated: Date | null;
  polling: boolean;
  projectName?: string;
}

export default function Header({
  activeTab,
  onTabChange,
  onOpenSearch,
  onNewIssue,
  lastUpdated,
  polling,
  projectName,
}: HeaderProps) {
  const showSearch = activeTab !== 'settings' && activeTab !== 'memories';
  const showNew = activeTab !== 'settings' && activeTab !== 'memories';

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-brand">
          <img src="/favicon.svg" alt="" width="20" height="20" style={{ display: 'block' }} />
          <span className="logo">beadee</span>
          {projectName && <span className="header-project">{projectName}</span>}
        </div>

        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => onTabChange('list')}
          >
            List
          </button>
          <button
            className={`tab ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => onTabChange('kanban')}
          >
            Board
          </button>
          <button
            className={`tab ${activeTab === 'memories' ? 'active' : ''}`}
            onClick={() => onTabChange('memories')}
          >
            Memories
          </button>
        </nav>
      </div>

      <div className="header-right">
        <RefreshIndicator lastUpdated={lastUpdated} polling={polling} />

        {showSearch && (
          <button
            className="btn btn-secondary cog-btn"
            onClick={onOpenSearch}
            title="Search issues (f)"
            aria-label="Search issues"
          >
            <Search size={15} strokeWidth={1.75} />
          </button>
        )}

        {showNew && (
          <button className="btn btn-primary" onClick={onNewIssue}>
            + New
          </button>
        )}

        <button
          className={`btn btn-secondary cog-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange(activeTab === 'settings' ? 'list' : 'settings')}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={15} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
