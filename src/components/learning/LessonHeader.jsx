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

  return (
    <div className="lv-head">
      <span className="lv-emoji" aria-hidden="true">{emoji}</span>
      <div className="lv-head-text">
        {moduleTitle && (
          <div className="lv-kicker">
            <span className="lv-kicker-label">Module</span>
            <span className="lv-kicker-value">{moduleTitle}</span>
          </div>
        )}
        <h1 className="lv-title">{lesson.title}</h1>
        {summaryBits.length > 0 && (
          <p className="lv-summaryline">
            One build session · {summaryBits.join(' · ')}.
          </p>
        )}
        {difficulty && (
          <div className="lv-meta">
            <span className={`lv-diff lv-diff-${difficulty}`}>{difficulty}</span>
            {duration && <span className="lv-dur">Duration: {duration}</span>}
            {conceptCount > 0 && <span className="lv-chip">{conceptCount} concepts</span>}
            {taskCount > 0 && <span className="lv-chip">{taskCount} tasks</span>}
            {scaffolding && scaffolding !== 'full' && (
              <span className={`lv-scaffolding lv-scaffolding-${scaffolding}`}>
                {scaffolding === 'partial' && 'Partial template'}
                {scaffolding === 'starter' && 'Starter code'}
                {scaffolding === 'requirements' && 'Write from scratch'}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="lv-actions">
        <button
          type="button"
          className={`lv-action-btn ${bookmarked ? 'active' : ''}`}
          onClick={onToggleBookmark}
          title={bookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
          data-label={bookmarked ? 'Saved' : 'Save'}
        >
          {bookmarked ? '★' : '☆'}
        </button>
        <button
          type="button"
          className={`lv-action-btn ${showNotes ? 'active' : ''}`}
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

