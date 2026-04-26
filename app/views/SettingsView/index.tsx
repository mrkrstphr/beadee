import { Check } from 'lucide-react';
import { useLocalStorageState } from '../../hooks/useLocalStorageState.js';
import './SettingsView.css';

type ThemeColors = {
  bg: string;
  bgSurface: string;
  bgElevated: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  success: string;
  danger: string;
  mono?: boolean;
};

const DARK_COLORS: ThemeColors = {
  bg: '#0d1117',
  bgSurface: '#161b22',
  bgElevated: '#21262d',
  border: '#30363d',
  text: '#e6edf3',
  textMuted: '#7d8590',
  accent: '#58a6ff',
  success: '#3fb950',
  danger: '#f85149',
};

const LIGHT_COLORS: ThemeColors = {
  bg: '#ffffff',
  bgSurface: '#f6f8fa',
  bgElevated: '#eaeef2',
  border: '#d0d7de',
  text: '#1f2328',
  textMuted: '#656d76',
  accent: '#0969da',
  success: '#1a7f37',
  danger: '#d1242f',
};

const THEMES: {
  id: string;
  label: string;
  desc: string;
  colors: ThemeColors;
  autoSplit?: boolean;
}[] = [
  {
    id: 'auto',
    label: 'Auto',
    desc: 'Follow OS preference',
    autoSplit: true,
    colors: DARK_COLORS,
  },
  {
    id: 'dark',
    label: 'Dark',
    desc: 'GitHub-style dark',
    colors: DARK_COLORS,
  },
  {
    id: 'light',
    label: 'Light',
    desc: 'Clean light mode',
    colors: LIGHT_COLORS,
  },
  {
    id: 'dracula',
    label: 'Dracula',
    desc: 'Classic purple & cyan',
    colors: {
      bg: '#282a36',
      bgSurface: '#21222c',
      bgElevated: '#343746',
      border: '#44475a',
      text: '#f8f8f2',
      textMuted: '#6272a4',
      accent: '#bd93f9',
      success: '#50fa7b',
      danger: '#ff5555',
    },
  },
  {
    id: 'synthwave',
    label: 'Synthwave',
    desc: 'Deep purple & neon pink',
    colors: {
      bg: '#1a1033',
      bgSurface: '#241847',
      bgElevated: '#2e1f5e',
      border: '#4a3580',
      text: '#f0e6ff',
      textMuted: '#9d7fcf',
      accent: '#f72585',
      success: '#06d6a0',
      danger: '#ef233c',
    },
  },
  {
    id: 'hacker',
    label: 'Hacker',
    desc: 'Green on black, monospace',
    colors: {
      bg: '#000000',
      bgSurface: '#0a0a0a',
      bgElevated: '#111111',
      border: '#1a3a1a',
      text: '#00ff41',
      textMuted: '#007a1f',
      accent: '#00ff41',
      success: '#00ff41',
      danger: '#ff0000',
      mono: true,
    },
  },
];

const renderContent = (c: ThemeColors, clipPath?: string) => (
  <div
    className="theme-preview-content"
    style={clipPath ? { clipPath, position: 'absolute', inset: 0 } : undefined}
  >
    <div
      className="theme-preview-sidebar"
      style={{ background: c.bgSurface, borderRightColor: c.border }}
    >
      {[c.accent, c.textMuted, c.textMuted].map((dotColor, i) => (
        <div key={i} className="theme-preview-item">
          <span className="theme-preview-item-dot" style={{ background: dotColor }} />
          <span
            className="theme-preview-item-line"
            style={{ background: i === 0 ? c.text : c.textMuted }}
          />
        </div>
      ))}
    </div>
    <div className="theme-preview-main" style={{ background: c.bg }}>
      <span className="theme-preview-title" style={{ background: c.text }} />
      <span className="theme-preview-subtitle" style={{ background: c.textMuted }} />
      <span className="theme-preview-button" style={{ background: c.accent }} />
    </div>
  </div>
);

function ThemePreview({ colors, autoSplit }: { colors: ThemeColors; autoSplit?: boolean }) {
  const fontStyle = colors.mono ? { fontFamily: "'Courier New', Courier, monospace" } : {};

  return (
    <div className="theme-preview-window" style={{ borderColor: colors.border, ...fontStyle }}>
      <div
        className="theme-preview-titlebar"
        style={{ background: colors.bgElevated, borderBottomColor: colors.border }}
      >
        <span className="theme-preview-traffic" style={{ background: '#ff5f57' }} />
        <span className="theme-preview-traffic" style={{ background: '#febc2e' }} />
        <span className="theme-preview-traffic" style={{ background: '#28c840' }} />
        <span className="theme-preview-wintitle" style={{ color: colors.textMuted }}>
          beadee
        </span>
      </div>
      <div
        className="theme-preview-body"
        style={{ background: colors.bg, position: 'relative', overflow: 'hidden' }}
      >
        {autoSplit ? (
          <>
            {renderContent(colors, 'polygon(0 0, 100% 0, 0 100%)')}
            {renderContent(LIGHT_COLORS, 'polygon(100% 0, 100% 100%, 0 100%)')}
            <div className="theme-preview-auto-divider" />
          </>
        ) : (
          renderContent(colors)
        )}
      </div>
    </div>
  );
}

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
                <ThemePreview colors={t.colors} autoSplit={t.autoSplit} />
                <span className="theme-card-label">
                  {t.label}
                  {t.id === theme && (
                    <Check size={13} strokeWidth={2.5} className="theme-card-check" />
                  )}
                </span>
                <span className="theme-card-desc">{t.desc}</span>
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
