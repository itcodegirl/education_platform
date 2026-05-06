// Bookmark mutation hooks — both end up submitting the same
// "toggle-bookmark" intent through useFetcher, but the call shapes
// differ:
//
//   - useToggleBookmark: LessonView, where the lesson context is
//     already known. Returns the current bookmarked state plus a
//     toggle callback.
//   - useRemoveBookmark: BookmarksPanel, where the panel iterates
//     a list of bookmarks and needs a remove-by-bookmark callback.
//
// The shared pieces (useFetcher, useLocation, syncFailure plumbing,
// optimistic toggle dispatch) live in submitBookmarkMutation below
// so both surfaces stay consistent.

import { useCallback } from 'react';
import { useFetcher, useLocation } from 'react-router-dom';
import { useProgressData, useSR } from '../providers';
import { useFetcherSyncFailure } from './useFetcherSyncFailure';

function buildBookmarkSubmitter({ bookmarkMutation, location, toggleBookmark }) {
  return ({ mode, lessonKey, courseId, lessonTitle }) => {
    // Optimistic local update first so the UI doesn't wait on
    // the network round trip; the route mutation reconciles it.
    toggleBookmark(lessonKey, courseId, lessonTitle, { skipRemote: true });
    bookmarkMutation.submit(
      {
        intent: 'toggle-bookmark',
        mode,
        lessonKey,
        courseId,
        lessonTitle,
      },
      {
        method: 'post',
        action: location.pathname,
      },
    );
  };
}

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
    const submit = buildBookmarkSubmitter({ bookmarkMutation, location, toggleBookmark });
    submit({
      mode: bookmarked ? 'remove' : 'save',
      lessonKey,
      courseId,
      lessonTitle,
    });
  }, [
    bookmarked,
    toggleBookmark,
    bookmarkMutation,
    lessonKey,
    courseId,
    lessonTitle,
    location,
  ]);

  return { bookmarked, handleToggleBookmark };
}

export function useRemoveBookmark({ syncFailureLabel = 'bookmarks panel' } = {}) {
  const { toggleBookmark } = useSR();
  const {
    markSyncFailed = () => {},
    enqueuePendingSyncWrite = () => false,
  } = useProgressData();
  const bookmarkMutation = useFetcher();
  const location = useLocation();

  useFetcherSyncFailure(
    bookmarkMutation,
    { markSyncFailed, enqueuePendingSyncWrite },
    syncFailureLabel,
  );

  // Returned callback expects a bookmark row from useSR().bookmarks
  // (which uses the DB column names lesson_key / course_id /
  // lesson_title). The wire format the route action expects is
  // camelCase, so we translate at the boundary.
  const handleRemoveBookmark = useCallback(
    (bookmark) => {
      const submit = buildBookmarkSubmitter({ bookmarkMutation, location, toggleBookmark });
      submit({
        mode: 'remove',
        lessonKey: bookmark.lesson_key,
        courseId: bookmark.course_id,
        lessonTitle: bookmark.lesson_title,
      });
    },
    [bookmarkMutation, location, toggleBookmark],
  );

  return { handleRemoveBookmark };
}
