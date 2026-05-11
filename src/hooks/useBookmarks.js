// useBookmarks — owns the lesson-bookmark surface for the active
// learner. The bookmark identity is the normalized lessonKey; both
// the local state shape and the persistence wire match the
// ProgressContext defaults so nothing about the on-disk layout
// changes when the data flows through this hook.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  findExistingBookmark,
  isBookmarkedLesson,
  normalizeProgressLessonKey,
  removeEquivalentBookmarks,
} from '../context/progressSavedLessonHelpers';

export function useBookmarks({ user, dbWrite, createProgressWrite }) {
  const [bookmarks, setBookmarks] = useState([]);
  // Mirror the latest list in a ref so toggleBookmark can read the
  // current value synchronously and decide between add / remove
  // without relying on the closure capture of the state value
  // (which would be stale when two toggles fire in the same tick).
  const bookmarksRef = useRef([]);

  useEffect(() => {
    bookmarksRef.current = bookmarks;
  }, [bookmarks]);

  const replaceBookmarks = useCallback((next) => {
    const nextList = Array.isArray(next) ? next : [];
    bookmarksRef.current = nextList;
    setBookmarks(nextList);
  }, []);

  const resetBookmarks = useCallback(() => {
    bookmarksRef.current = [];
    setBookmarks([]);
  }, []);

  const toggleBookmark = useCallback(async (lessonKey, courseId, lessonTitle, options = {}) => {
    if (!user) return;
    const skipRemote = Boolean(options?.skipRemote);
    const normalizedLessonKey = normalizeProgressLessonKey(lessonKey);
    const existing = findExistingBookmark(bookmarksRef.current, normalizedLessonKey);
    const resourceKey = `bookmark:${normalizedLessonKey}`;

    if (existing) {
      const next = removeEquivalentBookmarks(bookmarksRef.current, normalizedLessonKey);
      bookmarksRef.current = next;
      setBookmarks(next);
      if (!skipRemote) {
        // Some learners have legacy entries where existing.lesson_key
        // and the normalized key differ; deleting both forms keeps
        // the cloud row from resurrecting after a partial sync.
        const removalKeys = new Set([existing.lesson_key, normalizedLessonKey]);
        removalKeys.forEach((key) => {
          dbWrite(
            createProgressWrite('removeBookmark', { lessonKey: key }),
            'removeBookmark',
            { resourceKey },
          );
        });
      }
      return;
    }

    const newBookmark = {
      lesson_key: normalizedLessonKey,
      course_id: courseId,
      lesson_title: lessonTitle,
      created_at: new Date().toISOString(),
    };
    const next = [...bookmarksRef.current, newBookmark];
    bookmarksRef.current = next;
    setBookmarks(next);

    if (!skipRemote) {
      dbWrite(
        createProgressWrite('addBookmark', {
          bookmark: {
            lessonKey: normalizedLessonKey,
            courseId,
            lessonTitle,
          },
        }),
        'addBookmark',
        { resourceKey },
      );
    }
  }, [user, dbWrite, createProgressWrite]);

  const isBookmarked = useCallback((lessonKey) => {
    const normalizedLessonKey = normalizeProgressLessonKey(lessonKey);
    return isBookmarkedLesson(bookmarks, normalizedLessonKey);
  }, [bookmarks]);

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    replaceBookmarks,
    resetBookmarks,
  };
}
