import { useEffect, useMemo, useRef, useState } from 'react';
import { buildSearchIndex } from '../../data/reference/search-index';
import { useCourseContent } from '../../providers';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function SearchPanel({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const { ensureAllLoaded, loadedCourseIds, allCoursesLoaded } = useCourseContent();

  useEffect(() => {
    ensureAllLoaded();
  }, [ensureAllLoaded]);

  const searchIndex = useMemo(
    () => buildSearchIndex(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadedCourseIds],
  );

  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });

  useEffect(() => {
    if (!isOpen) return undefined;

    setQuery('');
    setActiveIndex(-1);
    // Defer focus a tick so the modal has finished its open animation
    // and the focus call lands on the visible input instead of an
    // animating element. The cleanup return matters: if the user
    // closes the panel within 100ms, or the component unmounts, we
    // would otherwise try to focus a hidden / stale element.
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(focusTimer);
  }, [isOpen]);

  const normalizedQuery = query.toLowerCase();
  const results = normalizedQuery.length >= 2
    ? searchIndex
        .filter((entry) =>
          entry.title.toLowerCase().includes(normalizedQuery)
          || entry.module.toLowerCase().includes(normalizedQuery)
          || entry.course.toLowerCase().includes(normalizedQuery)
          || entry.keywords.toLowerCase().includes(normalizedQuery),
        )
        .slice(0, 15)
    : [];

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

  const highlight = (text) => {
    const safe = escapeHtml(text);
    if (!normalizedQuery) return safe;
    const needle = escapeHtml(normalizedQuery).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!needle) return safe;
    const regex = new RegExp(`(${needle})`, 'gi');
    return safe.replace(regex, '<mark>$1</mark>');
  };

  const handleClick = (entry) => {
    onNavigate(entry.courseIdx, entry.modIdx, entry.lesIdx);
    onClose();
  };

  const handleInputKeyDown = (event) => {
    if (!results.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((previous) => (previous + 1) % results.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((previous) => (previous <= 0 ? results.length - 1 : previous - 1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (selected) handleClick(selected);
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
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Search lessons"
        tabIndex={-1}
      >
        <div className="search-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Jump faster</p>
            <h2 className="search-title">Search lessons</h2>
          </div>
          <button type="button" className="cheatsheet-close" onClick={onClose} aria-label="Close search">
            ×
          </button>
        </div>

        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search lessons, modules, and concepts..."
            aria-label="Search lessons"
            aria-describedby="search-shortcut-hint"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            aria-autocomplete="list"
            aria-controls="search-results-list"
            aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
            role="combobox"
            aria-expanded={results.length > 0}
          />
          <span id="search-shortcut-hint" className="search-hint">
            Enter opens the top result, Esc closes this panel
          </span>
        </div>

        <div className="search-results" id="search-results-list" role="listbox" aria-label="Search results">
          {normalizedQuery.length < 2 ? (
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
                  key={`${result.course}-${result.module}-${result.title}-${index}`}
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
                      {result.course} {'>'}{' '}
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
