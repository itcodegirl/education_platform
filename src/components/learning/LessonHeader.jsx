// ═══════════════════════════════════════════════
// LESSON HEADER — Metadata row + bookmark & notes toggle
//
// Pure presentational component. Takes the lesson object, the
// bookmark state, and the notes toggle state; renders the kicker,
// title, difficulty chips, and the two action buttons. Owns
// nothing — the parent LessonView orchestrates state.
// ═══════════════════════════════════════════════

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
        {difficulty && (
          <div className="lv-meta">
            <span className={`lv-diff lv-diff-${difficulty}`}>{difficulty}</span>
            {duration && <span className="lv-dur">⏱ {duration}</span>}
            {conceptCount > 0 && <span className="lv-chip">{conceptCount} concepts</span>}
            {taskCount > 0 && <span className="lv-chip">{taskCount} tasks</span>}
            {scaffolding && scaffolding !== 'full' && (
              <span className={`lv-scaffolding lv-scaffolding-${scaffolding}`}>
                {scaffolding === 'partial' && '🔧 Partial template'}
                {scaffolding === 'starter' && '🚀 Starter code'}
                {scaffolding === 'requirements' && '📋 Write from scratch'}
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
          ✎
        </button>
      </div>
    </div>
  );
}
