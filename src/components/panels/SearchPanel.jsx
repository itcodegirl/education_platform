import { useEffect, useMemo, useRef, useState } from 'react';
import { getCachedSearchIndex, loadSearchIndex } from '../../data/reference/search-index';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useCourseContent } from '../../providers/CourseContentProvider';

export function SearchPanel({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchIndex, setSearchIndex] = useState(() => getCachedSearchIndex());
  const [isIndexLoading, setIsIndexLoading] = useState(() => getCachedSearchIndex().length === 0);
  const [indexLoadError, setIndexLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const hasRequestedFullIndexRef = useRef(false);
  const { ensureAllLoaded, allCoursesLoaded } = useCourseContent();
  const normalizedQuery = query.toLowerCase();

  useEffect(() => {
    let cancelled = false;
    if (!isOpen) return undefined;

    if (searchIndex.length > 0) {
      setIsIndexLoading(false);
      setIndexLoadError('');
      return undefined;
    }

    setIsIndexLoading(true);
    setIndexLoadError('');

    void loadSearchIndex()
      .then((entries) => {
        if (cancelled) return;
        setSearchIndex(entries);
        setIsIndexLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setSearchIndex([]);
        setIsIndexLoading(false);
        setIndexLoadError(error?.message || 'Search is unavailable right now.');
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, loadAttempt, searchIndex.length]);

  useEffect(() => {
    if (!isOpen || normalizedQuery.length < 2 || allCoursesLoaded || hasRequestedFullIndexRef.current) {
      return;
    }

    hasRequestedFullIndexRef.current = true;
    void ensureAllLoaded();
  }, [allCoursesLoaded, ensureAllLoaded, isOpen, normalizedQuery]);

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

  const results = useMemo(() => {
    if (normalizedQuery.length < 2 || searchIndex.length === 0) return [];

    return searchIndex
      .filter((entry) =>
        entry.title.toLowerCase().includes(normalizedQuery)
        || entry.module.toLowerCase().includes(normalizedQuery)
        || entry.course.toLowerCase().includes(normalizedQuery)
        || entry.keywords.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 15);
  }, [normalizedQuery, searchIndex]);

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

  const searchStatus = normalizedQuery.length < 2
    ? 'Type at least two letters to search lessons.'
    : isIndexLoading
      ? 'Preparing the lesson search index.'
      : indexLoadError
        ? indexLoadError
        : results.length === 0
          ? `No results for ${query}.`
          : activeIndex >= 0
            ? `${results[activeIndex].title} selected. Press Enter to open.`
            : `${results.length} result${results.length === 1 ? '' : 's'}${allCoursesLoaded ? '' : '. Additional courses are still loading.'}`;

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
        aria-labelledby="search-panel-title"
        aria-describedby="search-shortcut-hint"
        tabIndex={-1}
      >
        <div className="search-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Jump faster</p>
            <h2 id="search-panel-title" className="search-title">Search lessons</h2>
          </div>
          <button type="button" className="cheatsheet-close" onClick={onClose} aria-label="Close search">
            ×
          </button>
        </div>

        <div className="search-input-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            ref={inputRef}
            type="search"
            className="search-input"
            placeholder="Search lessons, modules, and concepts..."
            aria-label="Search lessons"
            aria-describedby="search-shortcut-hint search-results-status"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            autoComplete="off"
            inputMode="search"
            enterKeyHint="search"
            spellCheck="false"
            aria-controls="search-results-list"
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear search query"
              onClick={() => {
                setQuery('');
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
            >
              Clear
            </button>
          )}
          <span id="search-shortcut-hint" className="search-hint">
            Enter opens the top result, Esc closes this panel
          </span>
        </div>

        <div
          className="search-results"
          id="search-results-list"
          aria-label="Search results"
        >
          <div
            id="search-results-status"
            className={results.length > 0 ? 'search-meta' : 'sr-only'}
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {searchStatus}
          </div>
          {normalizedQuery.length < 2 ? (
            <div className="search-empty">
              <p><strong>Search all lessons</strong></p>
              <p className="empty-state-msg">
                {isIndexLoading
                  ? 'The lesson catalog is loading. You can start typing now and results will appear as soon as it is ready.'
                  : 'Type at least two letters from a lesson, module, language, or concept.'}
              </p>
            </div>
          ) : indexLoadError ? (
            <div className="search-empty">
              <p><strong>Search is unavailable right now.</strong></p>
              <p className="empty-state-msg">
                The rest of your lesson workspace is still safe. Close this panel and try again in a moment.
              </p>
              <button
                type="button"
                className="empty-state-action"
                onClick={() => {
                  setSearchIndex([]);
                  setIsIndexLoading(true);
                  setIndexLoadError('');
                  setLoadAttempt((previous) => previous + 1);
                }}
              >
                Retry search
              </button>
            </div>
          ) : isIndexLoading ? (
            <div className="search-empty">
              <p><strong>Preparing lesson search…</strong></p>
              <p className="empty-state-msg">
                Loading the lightweight lesson catalog so search stays fast without pulling in every course.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <p><strong>No results for &ldquo;{query}&rdquo;</strong></p>
              <p className="empty-state-msg">
                Try a broader term like HTML, layout, state, quiz, or the name of a course.
              </p>
              <button
                type="button"
                className="empty-state-action"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <ul className="search-results-list" role="list">
              {results.map((result, index) => (
                <li key={`${result.course}-${result.module}-${result.title}-${index}`}>
                  <button
                    id={`search-result-${index}`}
                    type="button"
                    className={`search-result ${activeIndex === index ? 'active' : ''}`}
                    onClick={() => handleClick(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="sr-icon" aria-hidden="true">{result.icon}</span>
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
