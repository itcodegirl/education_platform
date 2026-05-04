import { useState, useCallback } from 'react';
import { trackEvent } from '../lib/analytics';

const MARK_DONE_MIN_FEEDBACK_MS = 350;

/**
 * Manages the "mark lesson done" action: optimistic toggle, fetcher submit,
 * analytics, and the minimum-feedback delay so the button doesn't flicker.
 *
 * Extracted from AppLayout to keep the action logic independently testable.
 */
export function useLessonMarkDone({
  completedSet,
  stableLessonKey,
  legacyLessonKey,
  courseId,
  moduleId,
  lessonId,
  mutationActionPath,
  progressMutation,
  toggleLessonDone,
  lessonViewStartRef,
}) {
  const [marking, setMarking] = useState(false);

  const handleMarkDone = useCallback(async () => {
    if (marking) return;
    setMarking(true);
    const startedAt = Date.now();
    try {
      const wasDone = completedSet.has(stableLessonKey) || completedSet.has(legacyLessonKey);
      const keyToToggle = completedSet.has(stableLessonKey)
        ? stableLessonKey
        : completedSet.has(legacyLessonKey)
          ? legacyLessonKey
          : stableLessonKey;
      const nextMode = wasDone ? 'uncomplete' : 'complete';
      toggleLessonDone(keyToToggle, { skipRemote: true });
      progressMutation.submit(
        { intent: 'toggle-progress', mode: nextMode, lessonKey: keyToToggle },
        { method: 'post', action: mutationActionPath },
      );
      trackEvent('lesson_completion_toggled', {
        courseId,
        moduleId,
        lessonId,
        completionState: wasDone ? 'unmarked' : 'marked_complete',
        secondsOnLesson: Math.round((Date.now() - lessonViewStartRef.current) / 1000),
      });
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(MARK_DONE_MIN_FEEDBACK_MS - elapsed, 0);
      if (remaining > 0) {
        setTimeout(() => setMarking(false), remaining);
      } else {
        setMarking(false);
      }
    }
  }, [
    completedSet,
    courseId,
    legacyLessonKey,
    lessonId,
    lessonViewStartRef,
    marking,
    moduleId,
    mutationActionPath,
    progressMutation,
    stableLessonKey,
    toggleLessonDone,
  ]);

  return { marking, handleMarkDone };
}
