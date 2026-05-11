import { memo } from 'react';

export const LessonFocusStrip = memo(function LessonFocusStrip({
  lessonPosition,
  currentStepTitle,
  currentStepCopy,
  masteryStatus = null,
  syncStatus,
  onRetrySync,
}) {
  const urgentSyncTone = syncStatus.tone === 'warning' || syncStatus.tone === 'queued';
  const syncRole = urgentSyncTone ? 'alert' : 'status';
  const syncLiveMode = urgentSyncTone ? 'assertive' : 'polite';
  const syncBusy = syncStatus.tone === 'saving';

  return (
    <section className="lesson-focus-strip" aria-label="Current lesson step">
      <span className="lesson-focus-eyebrow">{lessonPosition}</span>
      <strong>{currentStepTitle}</strong>
      <span>{currentStepCopy}</span>
      {masteryStatus && (
        <span className={`lesson-mastery-status lesson-mastery-status-${masteryStatus.tone}`}>
          <span className="lesson-mastery-label">{masteryStatus.label}</span>
          <span className="lesson-mastery-detail">{masteryStatus.detail}</span>
        </span>
      )}
      <span className="lesson-sync-row">
        <span
          className={`lesson-sync-status lesson-sync-status-${syncStatus.tone}`}
          role={syncRole}
          aria-live={syncLiveMode}
          aria-atomic="true"
          aria-busy={syncBusy ? 'true' : undefined}
        >
          <span className="lesson-sync-dot" aria-hidden="true" />
          <span className="lesson-sync-copy">
            <span className="lesson-sync-label">{syncStatus.label}</span>
            <span className="lesson-sync-detail">{syncStatus.detail}</span>
          </span>
        </span>
        {syncStatus.actionLabel && onRetrySync && (
          <button
            type="button"
            className="lesson-sync-action"
            onClick={onRetrySync}
            aria-label={syncStatus.actionAriaLabel || syncStatus.actionLabel}
          >
            {syncStatus.actionLabel}
          </button>
        )}
      </span>
    </section>
  );
});

