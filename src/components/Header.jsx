import { useState, useEffect, useRef } from 'react'
import { useHealth } from '../hooks/useIssues.js'

const THEMES = [
  { id: 'dark',      label: 'Dark',      swatch: '#0d1117' },
  { id: 'light',     label: 'Light',     swatch: '#ffffff' },
  { id: 'dracula',   label: 'Dracula',   swatch: '#282a36' },
  { id: 'synthwave', label: 'Synthwave', swatch: '#1a1033' },
  { id: 'hacker',    label: 'Hacker',    swatch: '#000000' },
  { id: 'auto',      label: 'Auto',      swatch: null },
]

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function Header({ activeTab, onTabChange, search, onSearchChange, onNewIssue, theme, onThemeChange }) {
  const { health } = useHealth()
  const [localSearch, setLocalSearch] = useState(search)
  const [themeOpen, setThemeOpen] = useState(false)
  const themeRef = useRef(null)
  const debouncedSearch = useDebounce(localSearch, 300)

  useEffect(() => { onSearchChange(debouncedSearch) }, [debouncedSearch])

  // Close theme dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setThemeOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentTheme = THEMES.find(t => t.id === theme) ?? THEMES[0]

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-brand">
          <span className="logo">beadee</span>
          {health?.projectName && (
            <span className="header-project">{health.projectName}</span>
          )}
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
        </nav>
      </div>

      <div className="header-right">
        <input
          className="header-search"
          type="search"
          placeholder="Search issues…"
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
        />

        <div className="theme-picker" ref={themeRef}>
          <button
            className="btn btn-secondary theme-trigger"
            onClick={() => setThemeOpen(o => !o)}
            title="Switch theme"
          >
            {currentTheme.swatch
              ? <span className="theme-swatch" style={{ background: currentTheme.swatch }} />
              : <span className="theme-swatch theme-swatch-auto">A</span>
            }
            <span className="theme-label">{currentTheme.label}</span>
            <span className="theme-caret">▾</span>
          </button>

          {themeOpen && (
            <div className="theme-dropdown">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  className={`theme-option ${t.id === theme ? 'active' : ''}`}
                  onClick={() => { onThemeChange(t.id); setThemeOpen(false) }}
                >
                  {t.swatch
                    ? <span className="theme-swatch" style={{ background: t.swatch }} />
                    : <span className="theme-swatch theme-swatch-auto">A</span>
                  }
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={onNewIssue}>
          + New
        </button>
      </div>
    </header>
  )
}
