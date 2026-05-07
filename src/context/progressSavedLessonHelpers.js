import { COURSES } from '../data';
import { lessonKeysEquivalent, resolveStableLessonKeyAcrossCourses } from '../utils/lessonKeys';

function hasOwn(map, key) {
  if (!key || !map || typeof map !== 'object') return false;
  return Object.prototype.hasOwnProperty.call(map, key);
}

export function normalizeProgressLessonKey(lessonKey, courses = COURSES) {
  return resolveStableLessonKeyAcrossCourses(lessonKey, courses);
}

export function findExistingBookmark(bookmarks = [], normalizedLessonKey, courses = COURSES) {
  if (!normalizedLessonKey) return null;

  return (Array.isArray(bookmarks) ? bookmarks : []).find((bookmark) =>
    lessonKeysEquivalent(bookmark.lesson_key, normalizedLessonKey, courses),
  ) || null;
}

export function removeEquivalentBookmarks(bookmarks = [], normalizedLessonKey, courses = COURSES) {
  if (!normalizedLessonKey) {
    return Array.isArray(bookmarks) ? [...bookmarks] : [];
  }

  return (Array.isArray(bookmarks) ? bookmarks : []).filter((bookmark) =>
    !lessonKeysEquivalent(bookmark.lesson_key, normalizedLessonKey, courses),
  );
}

export function isBookmarkedLesson(bookmarks = [], normalizedLessonKey, courses = COURSES) {
  return Boolean(findExistingBookmark(bookmarks, normalizedLessonKey, courses));
}

export function buildNotesMap(noteRows = []) {
  const notesMap = {};

  (Array.isArray(noteRows) ? noteRows : []).forEach((row) => {
    if (typeof row?.lesson_key !== 'string' || !row.lesson_key.trim()) return;
    notesMap[row.lesson_key] = row.content ?? '';
  });

  return notesMap;
}

export function getSavedNote(notes = {}, lessonKey, normalizedLessonKey, courses = COURSES) {
  if (hasOwn(notes, normalizedLessonKey)) return notes[normalizedLessonKey] ?? '';
  if (hasOwn(notes, lessonKey)) return notes[lessonKey] ?? '';

  const equivalentKey = Object.keys(notes).find((storedKey) =>
    lessonKeysEquivalent(storedKey, normalizedLessonKey, courses),
  );

  return equivalentKey ? (notes[equivalentKey] ?? '') : '';
}
