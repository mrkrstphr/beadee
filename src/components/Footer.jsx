import { version } from '../../package.json'

export default function Footer({ onShowShortcuts }) {
  return (
    <footer className="app-footer">
      <a className="footer-version" href="https://github.com/mrkrstphr/beadee" target="_blank" rel="noreferrer">beadee v{version}</a>
      <button className="footer-shortcuts-btn" onClick={onShowShortcuts} title="Keyboard shortcuts (?)">
        <kbd className="kbd kbd-small">?</kbd> shortcuts
      </button>
    </footer>
  )
}
