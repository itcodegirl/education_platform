// Prev / Next pagination row that sits below the lesson body.
// Extracted from AppLayout so the layout shell does not have to
// inline 50+ lines of button markup just for two buttons. Pure
// presentational — the parent owns the navigation handlers and
// the "is this the first/last lesson" predicates, and passes them
// in. The next-button accent color comes from the active course.

import { memo } from 'react';

export const LessonPagination = memo(function LessonPagination({
  onPrev,
  onNext,
  prevTitle,
  nextTitle,
  isFirst,
  isLast,
  accent,
}) {
  return (
    <nav className="nav-row" aria-label="Lesson pagination">
      <button
        type="button"
        className="nav-btn ui-btn ui-btn-secondary"
        onClick={onPrev}
        disabled={isFirst}
        aria-label={prevTitle ? `Previous lesson: ${prevTitle}` : 'Previous lesson'}
      >
        <span className="nav-btn-dir" aria-hidden="true">←</span>
        <span className="nav-btn-text">
          {prevTitle ? (
            <>
              <span className="nav-btn-label">Previous lesson</span>
              <span className="nav-btn-title">{prevTitle}</span>
            </>
          ) : 'Previous lesson'}
        </span>
      </button>
      <button
        type="button"
        className="nav-btn nx ui-btn ui-btn-primary"
        onClick={onNext}
        disabled={isLast}
        style={accent ? { background: accent } : undefined}
        aria-label={
          isLast ? 'Course complete' :
          nextTitle ? `Next: ${nextTitle}` : 'Next lesson'
        }
      >
        <span className="nav-btn-text">
          {isLast ? (
            'Track complete'
          ) : nextTitle ? (
            <>
              <span className="nav-btn-label">Continue to</span>
              <span className="nav-btn-title">{nextTitle}</span>
            </>
          ) : 'Next lesson'}
        </span>
        <span className="nav-btn-dir" aria-hidden="true">→</span>
      </button>
    </nav>
  );
});
