import { useEffect } from 'react';
import { X } from 'lucide-react';

const SHORTCUTS = [
  {
    group: 'Global',
    items: [
      { key: 'n', desc: 'New issue' },
      { key: '/', desc: 'Focus search' },
      { key: '1', desc: 'List view' },
      { key: '2', desc: 'Board view' },
      { key: 'm', desc: 'Memories' },
      { key: 's', desc: 'Settings' },
      { key: '?', desc: 'Show this help' },
      { key: 'Esc', desc: 'Close / deselect' },
    ],
  },
  {
    group: 'List View',
    items: [
      { key: 'j', desc: 'Next issue' },
      { key: 'k', desc: 'Previous issue' },
      { key: 'Enter', desc: 'Open selected' },
    ],
  },
  {
    group: 'Issue Detail',
    items: [
      { key: 'c', desc: 'Claim issue' },
      { key: 'e', desc: 'Edit issue' },
      { key: 'x', desc: 'Close issue' },
    ],
  },
];

interface ShortcutsHelpProps {
  onClose: () => void;
}

export default function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === '?') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal shortcuts-modal">
        <div className="modal-header">
          <h3 className="modal-title">Keyboard Shortcuts</h3>
          <button className="btn btn-secondary modal-close" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="shortcuts-body">
          {SHORTCUTS.map((group) => (
            <div key={group.group} className="shortcuts-group">
              <div className="shortcuts-group-label">{group.group}</div>
              {group.items.map((item) => (
                <div key={item.key} className="shortcut-row">
                  <kbd className="kbd">{item.key}</kbd>
                  <span className="shortcut-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
