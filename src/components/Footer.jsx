import { version } from '../../package.json'

export default function Footer({ onShowShortcuts }) {
  return (
    <footer className="app-footer">
      <span className="footer-version">beadee v{version}</span>
      <button className="footer-shortcuts-btn" onClick={onShowShortcuts} title="Keyboard shortcuts (?)">
        <kbd className="kbd kbd-small">?</kbd> shortcuts
      </button>
    </footer>
  )
}
