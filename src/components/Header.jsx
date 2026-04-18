import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import RefreshIndicator from './RefreshIndicator.jsx';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Header({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  onNewIssue,
  lastUpdated,
  polling,
  projectName,
}) {
  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

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
        {showSearch && (
          <input
            className="header-search"
            type="search"
            placeholder="Search issues…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        )}

        <RefreshIndicator lastUpdated={lastUpdated} polling={polling} />

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
