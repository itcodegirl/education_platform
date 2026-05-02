// useToggleBookmark — owns the bookmark mutation flow that
// LessonView used to inline. Same shape as useMarkLessonDone:
//   - dispatches the optimistic toggle to the SR/bookmarks slice
//   - submits the route mutation through useFetcher
//   - threads useFetcher failures into the progress sync queue
//
// Keeping the LessonView orchestrator as composition glue and
// the mutation logic in one testable hook.

import { useCallback } from 'react';
import { useFetcher, useLocation } from 'react-router-dom';
import { useProgressData, useSR } from '../providers';
import { useFetcherSyncFailure } from './useFetcherSyncFailure';

export function useToggleBookmark({ lessonKey, courseId, lessonTitle }) {
  const { toggleBookmark, isBookmarked } = useSR();
  const {
    markSyncFailed = () => {},
    enqueuePendingSyncWrite = () => false,
  } = useProgressData();
  const bookmarkMutation = useFetcher();
  const location = useLocation();

  useFetcherSyncFailure(
    bookmarkMutation,
    { markSyncFailed, enqueuePendingSyncWrite },
    'lesson bookmark',
  );

  const bookmarked = isBookmarked(lessonKey);

  const handleToggleBookmark = useCallback(() => {
    const nextMode = bookmarked ? 'remove' : 'save';
    // Optimistic local update first so the UI doesn't wait on
    // the network round trip; the route mutation reconciles it.
    toggleBookmark(lessonKey, courseId, lessonTitle, { skipRemote: true });
    bookmarkMutation.submit(
      {
        intent: 'toggle-bookmark',
        mode: nextMode,
        lessonKey,
        courseId,
        lessonTitle,
      },
      {
        method: 'post',
        action: location.pathname,
      },
    );
  }, [
    bookmarked,
    toggleBookmark,
    bookmarkMutation,
    lessonKey,
    courseId,
    lessonTitle,
    location.pathname,
  ]);

  return { bookmarked, handleToggleBookmark };
}
