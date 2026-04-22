export function LessonHeader({
  lesson,
  emoji,
  moduleTitle,
  difficulty,
  duration,
  conceptCount,
  taskCount,
  scaffolding,
  bookmarked,
  showNotes,
  onToggleBookmark,
  onToggleNotes,
}) {
  const summaryBits = [];
  if (duration) summaryBits.push(`${duration}`);
  if (conceptCount > 0) summaryBits.push(`${conceptCount} core concept${conceptCount === 1 ? '' : 's'}`);
  if (taskCount > 0) summaryBits.push(`${taskCount} practice task${taskCount === 1 ? '' : 's'}`);

  const summary = summaryBits.length > 0
    ? `One build session - ${summaryBits.join(' - ')}`
    : 'One build session';
  const bookmarkLabel = bookmarked ? 'Remove bookmark' : 'Bookmark this lesson';

  return (
    <div className="lesson-head">
      <span className="lesson-emoji" aria-hidden="true">{emoji}</span>
      <div className="lesson-head-text">
        {moduleTitle && (
          <div className="lesson-kicker">
            <span className="lesson-kicker-label">Module</span>
            <span className="lesson-kicker-value">{moduleTitle}</span>
          </div>
        )}
        <h1 className="lesson-title">{lesson.title}</h1>
        {summary && (
          <p className="lesson-summaryline">
            {summary}.
          </p>
        )}
        {difficulty && (
          <div className="lesson-meta">
            <span className={`lesson-diff lesson-diff-${difficulty}`}>{difficulty}</span>
            {duration && <span className="lesson-dur">Duration: {duration}</span>}
            {conceptCount > 0 && <span className="lesson-chip">{conceptCount} concepts</span>}
            {taskCount > 0 && <span className="lesson-chip">{taskCount} tasks</span>}
            {scaffolding && scaffolding !== 'full' && (
              <span className={`lesson-scaffolding lesson-scaffolding-${scaffolding}`}>
                {scaffolding === 'partial' && 'Partial template'}
                {scaffolding === 'starter' && 'Starter code'}
                {scaffolding === 'requirements' && 'Write from scratch'}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="lesson-actions">
        <button
          type="button"
          className={`lesson-action-btn ui-btn ui-btn-secondary ${bookmarked ? 'active' : ''}`}
          onClick={onToggleBookmark}
          title={bookmarkLabel}
          aria-pressed={bookmarked}
          aria-label={bookmarkLabel}
          data-label={bookmarked ? 'Saved' : 'Save'}
        >
          {bookmarked ? '\u2605' : '\u2606'}
        </button>
        <button
          type="button"
          className={`lesson-action-btn ui-btn ui-btn-secondary ${showNotes ? 'active' : ''}`}
          onClick={onToggleNotes}
          title="Notes"
          aria-expanded={showNotes}
          aria-label="Toggle lesson notes"
          data-label="Notes"
        >
          Notes
        </button>
      </div>
    </div>
  );
}

