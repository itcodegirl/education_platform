// ═══════════════════════════════════════════════
// GLOSSARY PANEL — Searchable term definitions
// ═══════════════════════════════════════════════

import { useState } from 'react';
import { GLOSSARY } from '../../data/reference/glossary';

export function GlossaryPanel({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  if (!isOpen) return null;

  const q = query.toLowerCase();
  const filtered = q
    ? GLOSSARY.filter((g) => g.term.toLowerCase().includes(q) || g.def.toLowerCase().includes(q))
    : GLOSSARY;

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-modal">
        <div className="cheatsheet-head">
          <h2>📖 Glossary</h2>
          <button type="button" className="cheatsheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="cheatsheet-body">
          <input className="glossary-search" placeholder="Search terms..."
                 value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
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
