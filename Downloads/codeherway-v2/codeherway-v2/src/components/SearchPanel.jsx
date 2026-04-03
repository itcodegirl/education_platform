// ═══════════════════════════════════════════════
// SEARCH PANEL — Cross-course search (⌘K)
// ═══════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { buildSearchIndex } from '../data/reference/search-index';

const searchIndex = buildSearchIndex();

export function SearchPanel({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase();
  const results = q.length >= 2
    ? searchIndex.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.module.toLowerCase().includes(q) ||
        e.course.toLowerCase().includes(q) ||
        e.keywords.toLowerCase().includes(q)
      ).slice(0, 15)
    : [];

  const highlight = (text) => {
    if (!q) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const handleClick = (entry) => {
    onNavigate(entry.courseIdx, entry.modIdx, entry.lesIdx);
    onClose();
  };

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-modal">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search lessons, topics, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="search-hint">ESC</span>
        </div>
        <div className="search-results">
          {q.length < 2 ? (
            <div className="search-empty">Start typing to search across all courses</div>
          ) : results.length === 0 ? (
            <div className="search-empty">No results for "{query}"</div>
          ) : (
            results.map((r, i) => (
              <div key={i} className="search-result" onClick={() => handleClick(r)}>
                <span className="sr-icon">{r.icon}</span>
                <div className="sr-body">
                  <div className="sr-title" dangerouslySetInnerHTML={{ __html: highlight(r.title) }} />
                  <div className="sr-path">{r.course} › <span dangerouslySetInnerHTML={{ __html: highlight(r.module) }} /></div>
                  {r.keywords && (
                    <div className="sr-snippet" dangerouslySetInnerHTML={{ __html: highlight(r.keywords.slice(0, 80)) }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
