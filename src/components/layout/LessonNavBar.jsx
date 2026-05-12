import { memo } from 'react';

import { getLessonCompletionActionCopy } from '../../utils/lessonCompletionCopy';

export const LessonNavBar = memo(function LessonNavBar({
  onPrev,
  onNext,
  onMarkDone,
  isFirst,
  isLast,
  isLastLesson,
  isDone,
  marking,
  showModQuiz,
  hasModuleQuiz,
  accent,
  lessonPosition,
  nextTitle,
  onOpenTools,
  toolsOpen = false,
}) {
  const nextLabel = isLast
    ? 'Course complete'
    : isLastLesson && hasModuleQuiz && !showModQuiz
      ? 'Take quiz'
      : 'Continue';

  const nextAriaLabel = isLast
    ? 'Finish this lesson flow'
    : isLastLesson && hasModuleQuiz && !showModQuiz
      ? 'Go to module quiz'
      : nextTitle
        ? `Continue to next lesson: ${nextTitle}`
        : 'Continue to next lesson';

  const doneCopy = getLessonCompletionActionCopy({ isDone, marking, surface: 'nav' });

  return (
    <nav className="lesson-nav" aria-label="Lesson navigation">
      <span className="lesson-nav-progress" aria-live="polite">
        {lessonPosition}
      </span>
      <button
        type="button"
        className="lesson-nav-btn lesson-nav-prev ui-btn ui-btn-secondary"
        onClick={onPrev}
        disabled={isFirst}
        aria-label={isFirst ? 'No previous lesson' : 'Go to previous lesson'}
      >
        <span className="lesson-nav-icon" aria-hidden="true">←</span>
        <span className="lesson-nav-label">Previous</span>
      </button>

      {!showModQuiz && (
        <button
          type="button"
          className={`lesson-nav-btn lesson-nav-done ui-btn ui-btn-secondary ${isDone ? 'is-done' : ''}`}
          onClick={onMarkDone}
          disabled={marking}
          aria-label={doneCopy.ariaLabel}
          title={doneCopy.title}
          aria-pressed={isDone}
        >
          <span className="lesson-nav-icon" aria-hidden="true">
            {marking ? '…' : isDone ? '✓' : '◌'}
          </span>
          <span className="lesson-nav-label">{doneCopy.label}</span>
        </button>
      )}

      {onOpenTools && (
        <button
          type="button"
          className={`lesson-nav-btn lesson-nav-tools ui-btn ui-btn-secondary ${toolsOpen ? 'is-open' : ''}`}
          onClick={onOpenTools}
          aria-label="Open learning tools"
          aria-expanded={toolsOpen}
          aria-haspopup="dialog"
          aria-controls="mobile-tools-sheet"
        >
          <span className="lesson-nav-icon" aria-hidden="true">...</span>
          <span className="lesson-nav-label">Tools</span>
        </button>
      )}

      <button
        type="button"
        className="lesson-nav-btn lesson-nav-next ui-btn ui-btn-primary"
        onClick={onNext}
        disabled={isLast}
        style={!isLast ? { background: accent } : undefined}
        aria-label={nextAriaLabel}
      >
        <span className="lesson-nav-label">{nextLabel}</span>
        {!isLast && <span className="lesson-nav-icon" aria-hidden="true">→</span>}
      </button>
    </nav>
  );
});
