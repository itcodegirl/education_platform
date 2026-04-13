// ===============================================
// SEARCH PANEL - Cross-course search (Cmd/Ctrl+K)
// ===============================================

import { useState, useEffect, useRef } from "react";
import { buildSearchIndex } from "../../data/reference/search-index";

const searchIndex = buildSearchIndex();

export function SearchPanel({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const q = query.toLowerCase();
  const results =
    q.length >= 2
      ? searchIndex
          .filter(
            (entry) =>
              entry.title.toLowerCase().includes(q) ||
              entry.module.toLowerCase().includes(q) ||
              entry.course.toLowerCase().includes(q) ||
              entry.keywords.toLowerCase().includes(q),
          )
          .slice(0, 15)
      : [];

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // SECURITY: Escape HTML in the source text AND the query before any
  // regex substitution, then wrap matches in <mark>. Without escaping,
  // a query like `<img src=x onerror=alert(1)>` (or future user-generated
  // search entries) would inject live markup into the DOM via
  // dangerouslySetInnerHTML below.
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);

  const highlight = (text) => {
    const safe = escapeHtml(text);
    if (!q) return safe;
    const needle = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!needle) return safe;
    const regex = new RegExp(`(${needle})`, "gi");
    return safe.replace(regex, "<mark>$1</mark>");
  };

  const handleClick = (entry) => {
    onNavigate(entry.courseIdx, entry.modIdx, entry.lesIdx);
    onClose();
  };

  const handleInputKeyDown = (event) => {
    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleClick(results[activeIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="search-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Search lessons"
      >
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search lessons, topics, tags..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <span className="search-hint">ESC</span>
        </div>

        <div className="search-results">
          {q.length < 2 ? (
            <div className="search-empty">
              Start typing to search across all courses
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">No results for "{query}"</div>
          ) : (
            <>
              <div className="search-meta">
                {results.length} result{results.length === 1 ? "" : "s"}
              </div>
              {results.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  className={`search-result ${activeIndex === index ? "active" : ""}`}
                  onClick={() => handleClick(result)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="sr-icon">{result.icon}</span>
                  <div className="sr-body">
                    <div
                      className="sr-title"
                      dangerouslySetInnerHTML={{
                        __html: highlight(result.title),
                      }}
                    />
                    <div className="sr-path">
                      {result.course} ›{" "}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: highlight(result.module),
                        }}
                      />
                    </div>
                    {result.keywords && (
                      <div
                        className="sr-snippet"
                        dangerouslySetInnerHTML={{
                          __html: highlight(result.keywords.slice(0, 80)),
                        }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
