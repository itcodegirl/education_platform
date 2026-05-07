import { describe, expect, it } from 'vitest';
import {
  buildNotesMap,
  findExistingBookmark,
  getSavedNote,
  isBookmarkedLesson,
  normalizeProgressLessonKey,
  removeEquivalentBookmarks,
} from './progressSavedLessonHelpers';

const TEST_COURSES = [
  {
    id: 'html',
    label: 'HTML',
    modules: [
      {
        id: 'basics',
        title: 'Basics',
        lessons: [
          { id: 'intro', title: 'Intro' },
          { id: 'forms', title: 'Forms' },
        ],
      },
    ],
  },
];

describe('progressSavedLessonHelpers', () => {
  it('normalizes legacy lesson keys to stable lesson ids', () => {
    expect(
      normalizeProgressLessonKey('HTML|Basics|Intro', TEST_COURSES),
    ).toBe('c:html|m:basics|l:intro');
  });

  it('finds and removes equivalent bookmarks by normalized lesson identity', () => {
    const bookmarks = [
      {
        lesson_key: 'HTML|Basics|Intro',
        course_id: 'html',
        lesson_title: 'Intro',
      },
      {
        lesson_key: 'c:html|m:basics|l:forms',
        course_id: 'html',
        lesson_title: 'Forms',
      },
    ];
    const normalizedLessonKey = 'c:html|m:basics|l:intro';

    expect(findExistingBookmark(bookmarks, normalizedLessonKey, TEST_COURSES)).toEqual(bookmarks[0]);
    expect(isBookmarkedLesson(bookmarks, normalizedLessonKey, TEST_COURSES)).toBe(true);
    expect(removeEquivalentBookmarks(bookmarks, normalizedLessonKey, TEST_COURSES)).toEqual([bookmarks[1]]);
  });

  it('builds a notes map and resolves equivalent lesson keys', () => {
    const notes = buildNotesMap([
      { lesson_key: 'HTML|Basics|Intro', content: 'Legacy note' },
      { lesson_key: '', content: 'ignored' },
    ]);

    expect(notes).toEqual({ 'HTML|Basics|Intro': 'Legacy note' });
    expect(
      getSavedNote(notes, 'c:html|m:basics|l:intro', 'c:html|m:basics|l:intro', TEST_COURSES),
    ).toBe('Legacy note');
  });
});
