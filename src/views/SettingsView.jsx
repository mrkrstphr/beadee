const THEMES = [
  { id: 'dark',      label: 'Dark',      swatch: '#0d1117', desc: 'GitHub-style dark' },
  { id: 'light',     label: 'Light',     swatch: '#ffffff', desc: 'Clean light mode' },
  { id: 'dracula',   label: 'Dracula',   swatch: '#282a36', desc: 'Classic purple & cyan' },
  { id: 'synthwave', label: 'Synthwave', swatch: '#1a1033', desc: 'Deep purple & neon pink' },
  { id: 'hacker',    label: 'Hacker',    swatch: '#000000', desc: 'Green on black, monospace' },
  { id: 'auto',      label: 'Auto',      swatch: null,      desc: 'Follow OS preference' },
]

export default function SettingsView({ theme, onThemeChange }) {
  return (
    <div className="settings-view">
      <div className="settings-content">
        <h2 className="settings-title">Settings</h2>

        <section className="settings-section">
          <h3 className="settings-section-title">Appearance</h3>
          <p className="settings-section-desc">Choose a color theme for the interface.</p>

          <div className="theme-grid">
            {THEMES.map(t => (
              <button
                key={t.id}
                className={`theme-card ${t.id === theme ? 'active' : ''}`}
                onClick={() => onThemeChange(t.id)}
              >
                <span
                  className="theme-card-swatch"
                  style={t.swatch
                    ? { background: t.swatch }
                    : { background: 'linear-gradient(135deg, #0d1117 50%, #ffffff 50%)' }
                  }
                />
                <span className="theme-card-label">{t.label}</span>
                <span className="theme-card-desc">{t.desc}</span>
                {t.id === theme && <span className="theme-card-check">✓</span>}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">More settings coming soon</h3>
          <p className="settings-section-desc">
            Future options may include default filters, polling interval, and display density.
          </p>
        </section>
      </div>
    </div>
  )
}
