import { Check } from 'lucide-react';
import { useLocalStorageState } from '../../hooks/useLocalStorageState.js';
import './SettingsView.css';

const THEMES = [
  { id: 'dark', label: 'Dark', swatch: '#0d1117', desc: 'GitHub-style dark' },
  { id: 'light', label: 'Light', swatch: '#ffffff', desc: 'Clean light mode' },
  { id: 'dracula', label: 'Dracula', swatch: '#282a36', desc: 'Classic purple & cyan' },
  { id: 'synthwave', label: 'Synthwave', swatch: '#1a1033', desc: 'Deep purple & neon pink' },
  { id: 'hacker', label: 'Hacker', swatch: '#000000', desc: 'Green on black, monospace' },
  { id: 'auto', label: 'Auto', swatch: null, desc: 'Follow OS preference' },
];

interface SettingsViewProps {
  theme: string;
  onThemeChange: (theme: string) => void;
}

export default function SettingsView({ theme, onThemeChange }: SettingsViewProps) {
  const [refetchOnFocus, setRefetchOnFocus] = useLocalStorageState('beadee-refetch-on-focus', true);

  return (
    <div className="settings-view">
      <div className="settings-content">
        <h2 className="settings-title">Settings</h2>

        <section className="settings-section">
          <h3 className="settings-section-title">Appearance</h3>
          <p className="settings-section-desc">Choose a color theme for the interface.</p>

          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-card ${t.id === theme ? 'active' : ''}`}
                onClick={() => onThemeChange(t.id)}
              >
                <span
                  className="theme-card-swatch"
                  style={
                    t.swatch
                      ? { background: t.swatch }
                      : { background: 'linear-gradient(135deg, #0d1117 50%, #ffffff 50%)' }
                  }
                />
                <span className="theme-card-label">{t.label}</span>
                <span className="theme-card-desc">{t.desc}</span>
                {t.id === theme && (
                  <Check size={14} strokeWidth={2.5} className="theme-card-check" />
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">Behavior</h3>

          <label className="settings-toggle-row">
            <span className="settings-toggle-label">
              Reload on focus
              <span className="settings-toggle-desc">
                Refresh all data when the browser tab regains focus
              </span>
            </span>
            <span className={`settings-toggle ${refetchOnFocus ? 'on' : ''}`} aria-hidden="true" />
            <input
              type="checkbox"
              className="settings-toggle-input"
              checked={refetchOnFocus}
              onChange={(e) => setRefetchOnFocus(e.target.checked)}
            />
          </label>
        </section>
      </div>
    </div>
  );
}
