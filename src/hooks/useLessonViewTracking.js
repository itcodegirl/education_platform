import { useEffect, useRef } from 'react';
import { trackEvent } from '../lib/analytics';

/**
 * Fires a `lesson_viewed` analytics event each time the active lesson changes.
 * Returns a ref to the timestamp when the current lesson was entered so callers
 * can compute `secondsOnLesson` at completion time.
 *
 * Extracted from AppLayout to keep analytics side-effects independently testable.
 */
export function useLessonViewTracking({ courseId, moduleId, lessonId, courseIndex, moduleIndex, lessonIndex, showModQuiz }) {
  const trackedLessonRef = useRef('');
  const lessonViewStartRef = useRef(Date.now());

  useEffect(() => {
    if (showModQuiz || !courseId || !moduleId || !lessonId) return;
    const lessonIdentity = `${courseId}|${moduleId}|${lessonId}`;
    if (trackedLessonRef.current === lessonIdentity) return;

    trackedLessonRef.current = lessonIdentity;
    lessonViewStartRef.current = Date.now();
    trackEvent('lesson_viewed', {
      courseId,
      moduleId,
      lessonId,
      courseIndex,
      moduleIndex,
      lessonIndex,
    });
  }, [courseId, moduleId, lessonId, courseIndex, moduleIndex, lessonIndex, showModQuiz]);

  return lessonViewStartRef;
}
