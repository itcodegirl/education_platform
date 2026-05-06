// useMarkLessonDone — owns the optimistic mark-done flow that
// AppLayout used to inline. The hook is responsible for:
//   - the `marking` button state (with the documented min-feedback
//     duration so the saving label can't flicker by sub-frame)
//   - dispatching the optimistic toggle to the learning engine
//   - submitting the route mutation through useFetcher
//   - threading useFetcher failures into the progress sync queue
//   - emitting the lesson_completion_toggled analytics event
//
// Pure orchestration on top of existing utilities; no new
// behaviour. Extracted from AppLayout so the layout component
// stays focused on render and the mark-done flow is finally
// testable end-to-end without a full layout render.

import { useCallback, useState } from 'react';
import { useFetcher } from 'react-router-dom';
import { useProgressData } from '../providers';
import { trackEvent } from '../lib/analytics';
import {
  MARK_DONE_MIN_FEEDBACK_MS,
  resolveLessonToggle,
} from '../utils/lessonToggle';
import { useFetcherSyncFailure } from './useFetcherSyncFailure';

export function useMarkLessonDone({
  completedSet,
  stableLessonKey,
  legacyLessonKey,
  toggleLessonDone,
  mutationActionPath,
  analyticsContext,
}) {
  const {
    markSyncFailed = () => {},
    enqueuePendingSyncWrite = () => false,
  } = useProgressData();
  const progressMutation = useFetcher();
  const [marking, setMarking] = useState(false);

  useFetcherSyncFailure(
    progressMutation,
    { markSyncFailed, enqueuePendingSyncWrite },
    'lesson progress',
  );

  const handleMarkDone = useCallback(async () => {
    if (marking) return;
    setMarking(true);
    const startedAt = Date.now();
    try {
      const { keyToToggle, wasDone } = resolveLessonToggle(
        completedSet,
        stableLessonKey,
        legacyLessonKey,
      );
      const nextMode = wasDone ? 'uncomplete' : 'complete';

      toggleLessonDone(keyToToggle, { skipRemote: true });
      progressMutation.submit(
        {
          intent: 'toggle-progress',
          mode: nextMode,
          lessonKey: keyToToggle,
        },
        {
          method: 'post',
          action: mutationActionPath,
        },
      );

      const start = analyticsContext?.lessonViewStartRef?.current ?? Date.now();
      trackEvent('lesson_completion_toggled', {
        courseId: analyticsContext?.courseId,
        moduleId: analyticsContext?.moduleId,
        lessonId: analyticsContext?.lessonId,
        completionState: wasDone ? 'unmarked' : 'marked_complete',
        secondsOnLesson: Math.round((Date.now() - start) / 1000),
      });
    } finally {
      // Keep the "Saving..." button state visible for at least
      // MARK_DONE_MIN_FEEDBACK_MS so the optimistic toggle doesn't
      // flicker by under one frame.
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
    stableLessonKey,
    legacyLessonKey,
    toggleLessonDone,
    mutationActionPath,
    progressMutation,
    marking,
    analyticsContext,
  ]);

  return { marking, handleMarkDone };
}
