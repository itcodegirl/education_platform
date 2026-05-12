// Lesson-shell topbar: hamburger + breadcrumb + learner status pills
// + search trigger + mark-done. Extracted from AppLayout so the
// layout shell does not host 70 lines of header markup. Pure
// presentational — every state and handler is owned by the parent.

import { memo } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { TopbarLearnerStatus } from './TopbarLearnerStatus';

export const LessonShellTopbar = memo(function LessonShellTopbar({
  // Hamburger
  isMobile,
  sidebarCollapsed,
  isSidebarOpen,
  onHamburgerClick,
  // Breadcrumb
  course,
  mod,
  les,
  showModQuiz,
  lessonPosition,
  // Learner status
  learnerName,
  readTime,
  xpTotal,
  level,
  coursePct,
  streak,
  pausedStreak,
  dailyCount,
  // Topbar actions
  isSearchActive,
  onToggleSearch,
  isDone,
  marking,
  onMarkDone,
  markDoneAriaLabel,
  markDoneLabel,
  markDoneTitle,
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button
          type="button"
          className="ham"
          onClick={onHamburgerClick}
          aria-label={isMobile ? 'Open course navigation' : sidebarCollapsed ? 'Expand course navigation' : 'Collapse course navigation'}
          aria-controls="course-sidebar"
          aria-expanded={isMobile ? isSidebarOpen : !sidebarCollapsed}
        >
          <span className="ham-glyph" aria-hidden="true">
            {isMobile ? '☰' : sidebarCollapsed ? '›' : '‹'}
          </span>
          <span className="ham-label">
            {isMobile ? 'Menu' : sidebarCollapsed ? 'Expand' : 'Collapse'}
          </span>
        </button>
        <Breadcrumb
          course={course}
          mod={mod}
          lesTitle={les.title}
          showModQuiz={showModQuiz}
          lessonPosition={lessonPosition}
        />
        <TopbarLearnerStatus
          learnerName={learnerName}
          readTime={readTime}
          showModQuiz={showModQuiz}
          xpTotal={xpTotal}
          level={level}
          coursePct={coursePct}
          streak={streak}
          pausedStreak={pausedStreak}
          dailyCount={dailyCount}
        />
        <div className="topbar-actions">
          <button
            type="button"
            className={`search-trigger ui-btn ui-btn-secondary ${isSearchActive ? 'active' : ''}`}
            onClick={onToggleSearch}
            aria-label="Open lesson search"
            aria-pressed={isSearchActive}
          >
            <span className="search-trigger-label">Search</span>
            <span className="search-trigger-mobile-hint">Tap to search</span>
            <kbd>Ctrl+K</kbd>
          </button>
          {!showModQuiz && (
            <button
              type="button"
              className={`mark-btn ${isDone ? 'dn' : ''}`}
              onClick={onMarkDone}
              disabled={marking}
              aria-label={markDoneAriaLabel}
              title={markDoneTitle}
              aria-pressed={isDone}
            >
              {isDone && !marking ? '✓ ' : ''}
              {markDoneLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  );
});
