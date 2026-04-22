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
    if (isOpen) {
      setQuery('');
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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
          />
          <span id="search-shortcut-hint" className="search-hint">
            Enter opens the top result, Esc closes this panel
          </span>
        </div>

        <div className="search-results">
          <p className="panel-meta search-support">
            {allCoursesLoaded
              ? 'Search across the full curriculum, then jump directly into the lesson you need.'
              : 'Search is live now for loaded tracks, and the rest of the curriculum is still streaming in.'}
          </p>

          {normalizedQuery.length < 2 ? (
            <div className="search-empty">
              Start with at least two characters. Example: flexbox, arrays, props, or loops.
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              No matches for "{query}". Try a broader term, module name, or concept keyword.
            </div>
          ) : (
            <>
              <div className="search-meta">
                {results.length} result{results.length === 1 ? '' : 's'}
              </div>
              <p className="panel-meta search-support">
                Tip: use arrow keys to highlight a result, then press Enter to jump there.
              </p>
              <div role="list" aria-label="Search results">
                {results.map((result, index) => (
                  <button
                    key={`${result.course}-${result.module}-${result.title}-${index}`}
                    type="button"
                    className={`search-result ${activeIndex === index ? 'active' : ''}`}
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
