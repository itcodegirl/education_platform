import { describe, it, expect } from 'vitest';
import {
  getLessonKeyVariants,
  hasLessonCompletion,
  getCourseCompletedLessonCount,
  lessonKeyBelongsToCourse,
  resolveStableLessonKey,
} from './lessonKeys';

const COURSE = {
  id: 'html',
  label: 'HTML',
  modules: [
    {
      id: 'm-basics',
      title: 'Basics',
      lessons: [
        { id: 'l-intro', title: 'Intro' },
        { id: 'l-tags', title: 'Tags' },
      ],
    },
    {
      id: 'm-semantic',
      title: 'Semantic',
      lessons: [{ id: 'l-aria', title: 'ARIA' }],
    },
  ],
};

describe('lessonKeys utilities', () => {
  it('generates stable and legacy keys from lesson metadata', () => {
    const variants = getLessonKeyVariants(COURSE, COURSE.modules[0], COURSE.modules[0].lessons[0]);
    expect(variants.stable).toBe('c:html|m:m-basics|l:l-intro');
    expect(variants.legacy).toBe('HTML|Basics|Intro');
  });

  it('treats stable and legacy completion keys as equivalent', () => {
    const stableSet = new Set(['c:html|m:m-basics|l:l-intro']);
    const legacySet = new Set(['HTML|Basics|Intro']);

    expect(hasLessonCompletion(stableSet, COURSE, COURSE.modules[0], COURSE.modules[0].lessons[0])).toBe(true);
    expect(hasLessonCompletion(legacySet, COURSE, COURSE.modules[0], COURSE.modules[0].lessons[0])).toBe(true);
  });

  it('counts completed lessons with mixed stable/legacy data during migration', () => {
    const mixed = [
      'c:html|m:m-basics|l:l-intro',
      'HTML|Basics|Tags',
      'c:html|m:m-semantic|l:l-aria',
    ];

    expect(getCourseCompletedLessonCount(mixed, COURSE)).toBe(3);
  });

  it('maps legacy keys to stable keys for admin analytics reconciliation', () => {
    const stable = resolveStableLessonKey(COURSE, 'HTML|Basics|Tags');
    expect(stable).toBe('c:html|m:m-basics|l:l-tags');
  });

  it('matches course ownership for both stable and legacy formats', () => {
    expect(lessonKeyBelongsToCourse('c:html|m:m-basics|l:l-intro', COURSE)).toBe(true);
    expect(lessonKeyBelongsToCourse('HTML|Basics|Intro', COURSE)).toBe(true);
    expect(lessonKeyBelongsToCourse('c:css|m:m-selectors|l:l-class', COURSE)).toBe(false);
  });
});
