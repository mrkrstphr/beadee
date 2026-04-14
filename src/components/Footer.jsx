export default function Footer({ onShowShortcuts }) {
  return (
    <footer className="app-footer">
      <span className="footer-version">beadee v0.1.0</span>
      <button className="footer-shortcuts-btn" onClick={onShowShortcuts} title="Keyboard shortcuts (?)">
        <kbd className="kbd kbd-small">?</kbd> shortcuts
      </button>
    </footer>
  )
}
