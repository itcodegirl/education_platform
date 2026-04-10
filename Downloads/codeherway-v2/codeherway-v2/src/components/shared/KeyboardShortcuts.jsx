// ═══════════════════════════════════════════════
// KEYBOARD SHORTCUTS — Overlay triggered by ? key
// ═══════════════════════════════════════════════

import { useEffect } from 'react';

const SHORTCUTS = [
  { keys: ['→'], label: 'Next lesson' },
  { keys: ['←'], label: 'Previous lesson' },
  { keys: ['D'], label: 'Mark done / undo' },
  { keys: ['M'], label: 'Toggle sidebar' },
  { keys: ['⌘', 'K'], label: 'Search lessons' },
  { keys: ['/'], label: 'Search lessons' },
  { keys: ['1-4'], label: 'Switch course (HTML, CSS, JS, React)' },
  { keys: ['?'], label: 'Show this help' },
];

export function KeyboardShortcuts({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === '?') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="search-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div className="search-modal" style={{ maxWidth: 420 }}>
        <div className="search-input-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 20 }}>⌨️</span>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
            Keyboard Shortcuts
          </span>
          <button
            type="button"
            className="cheatsheet-close"
            onClick={onClose}
            aria-label="Close shortcuts"
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {SHORTCUTS.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < SHORTCUTS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>{s.label}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text)',
                      minWidth: 28,
                      textAlign: 'center',
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
