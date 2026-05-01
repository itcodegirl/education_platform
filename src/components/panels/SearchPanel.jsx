// ===============================================
// SEARCH PANEL - Cross-course search (Cmd/Ctrl+K)
// ===============================================

import { useState, useEffect, useMemo, useRef } from "react";
import { buildSearchIndex } from "../../data/reference/search-index";
import { useCourseContent } from "../../providers";

export function SearchPanel({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  // Previously the search index was computed at module init time
  // (`const searchIndex = buildSearchIndex();` at the top of the file),
  // which froze the index with whatever COURSES contained the moment
  // this chunk loaded — typically just the active course. Now that
  // courses are lazy-loaded, we build the index inside a useMemo
  // keyed on how many courses are loaded, and we trigger the rest to
  // load on mount. The search works immediately for the active
  // course and expands as the others stream in.
  const { ensureAllLoaded, loadedCourseIds, allCoursesLoaded } = useCourseContent();
  useEffect(() => { ensureAllLoaded(); }, [ensureAllLoaded]);
  // `loadedCourseIds` is a stable Set reference that changes identity
  // when new courses load, so useMemo will rebuild the index as each
  // new course chunk arrives.
  const searchIndex = useMemo(
    () => buildSearchIndex(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadedCourseIds],
  );

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
            aria-label="Search lessons"
            aria-autocomplete="list"
            aria-controls="search-results-list"
            aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
            role="combobox"
            aria-expanded={results.length > 0}
          />
          <span className="search-hint">ESC</span>
        </div>

        <div className="search-results" id="search-results-list" role="listbox" aria-label="Search results">
          {q.length < 2 ? (
            <div className="search-empty">
              {allCoursesLoaded
                ? 'Start typing to search across all courses'
                : 'Start typing to search — loading additional courses…'}
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">No results for &ldquo;{query}&rdquo;</div>
          ) : (
            <>
              <div className="search-meta">
                {results.length} result{results.length === 1 ? "" : "s"}
                {!allCoursesLoaded && ' (loading more courses…)'}
              </div>
              {results.map((result, index) => (
                <button
                  key={index}
                  id={`search-result-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
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
