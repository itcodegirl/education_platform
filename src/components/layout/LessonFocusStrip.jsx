import { memo } from 'react';

export const LessonFocusStrip = memo(function LessonFocusStrip({
  lessonPosition,
  currentStepTitle,
  currentStepCopy,
  syncStatus,
}) {
  return (
    <section className="lesson-focus-strip" aria-label="Current lesson step">
      <span className="lesson-focus-eyebrow">{lessonPosition}</span>
      <strong>{currentStepTitle}</strong>
      <span>{currentStepCopy}</span>
      <span
        className={`lesson-sync-status lesson-sync-status-${syncStatus.tone}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="lesson-sync-dot" aria-hidden="true" />
        <span className="lesson-sync-copy">
          <span className="lesson-sync-label">{syncStatus.label}</span>
          <span className="lesson-sync-detail">{syncStatus.detail}</span>
        </span>
      </span>
    </section>
  );
});

