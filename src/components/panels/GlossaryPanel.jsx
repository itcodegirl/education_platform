// GLOSSARY PANEL - Searchable term definitions

import { useRef, useState } from "react";
import { GLOSSARY } from "../../data/reference/glossary";
import { useFocusTrap } from "../../hooks/useFocusTrap";

export function GlossaryPanel({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const modalRef = useRef(null);

  // initialFocus: first-tabbable lands the user on the search input
  // instead of the dialog shell, so they can start typing immediately.
  useFocusTrap(modalRef, {
    enabled: isOpen,
    onEscape: onClose,
    initialFocus: "first-tabbable",
  });

  if (!isOpen) return null;

  const q = query.toLowerCase();
  const filtered = q
    ? GLOSSARY.filter(
        (entry) =>
          entry.term.toLowerCase().includes(q) ||
          entry.def.toLowerCase().includes(q),
      )
    : GLOSSARY;

  return (
    <div
      className="search-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Glossary"
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Quick definitions</p>
            <h2>📖 Glossary</h2>
          </div>
          <button
            type="button"
            className="cheatsheet-close"
            onClick={onClose}
            aria-label="Close glossary"
          >
            ×
          </button>
        </div>
        <div className="cheatsheet-body">
          <input
            className="glossary-search"
            placeholder="Search terms..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search glossary terms"
          />
          <p className="panel-meta">
            {query.trim()
              ? `${filtered.length} match${filtered.length === 1 ? "" : "es"} for "${query.trim()}"`
              : `${GLOSSARY.length}+ coding terms, patterns, and platform language`}
          </p>
          {filtered.length === 0 ? (
            <p className="no-match-msg">
              No matches yet. Try a language, tag, or concept like flexbox,
              props, or API.
            </p>
          ) : (
            filtered.map((entry, index) => (
              <div key={index} className="gl-term">
                <strong>{entry.term}</strong>
                <span className="gl-badge">{entry.course}</span>
                <p>{entry.def}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
