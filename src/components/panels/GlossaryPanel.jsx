// ═══════════════════════════════════════════════
// GLOSSARY PANEL — Searchable term definitions
// ═══════════════════════════════════════════════

import { useRef, useState } from 'react';
import { GLOSSARY } from '../../data/reference/glossary';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function GlossaryPanel({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const modalRef = useRef(null);
  // initialFocus: first-tabbable lands the user on the search input
  // instead of the dialog shell, so they can start typing immediately.
  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose, initialFocus: 'first-tabbable' });
  if (!isOpen) return null;

  const q = query.toLowerCase();
  const filtered = q
    ? GLOSSARY.filter((g) => g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q))
    : GLOSSARY;

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Glossary"
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <h2>📖 Glossary</h2>
          <button type="button" className="cheatsheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="cheatsheet-body">
          <input
            className="glossary-search"
            placeholder="Search terms..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search glossary terms"
          />{/* autoFocus removed — useFocusTrap's initialFocus lands here first */}
          {filtered.length === 0 ? (
            <p className="no-match-msg">No matches.</p>
          ) : filtered.map((g, i) => (
            <div key={i} className="gl-term">
              <strong>{g.term}</strong>
              <span className="gl-badge">{g.course}</span>
              <p>{g.def}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
