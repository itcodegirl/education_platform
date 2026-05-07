import { describe, expect, it } from 'vitest';
import { findQuizEntityTitle, quizKeyBelongsToCourse } from './quizCourseOwnership';

const courses = [
  {
    id: 'html',
    modules: [
      {
        id: 'intro',
        title: 'HTML Intro',
        lessons: [{ id: 'lesson-01', title: 'Structure a Page' }],
      },
    ],
  },
  {
    id: 'css',
    modules: [
      {
        id: 101,
        title: 'CSS Basics',
        lessons: [{ id: 'css-1-1', title: 'Style a Heading' }],
      },
    ],
  },
];

describe('quiz course ownership', () => {
  it('uses stable course ids before legacy prefixes', () => {
    expect(quizKeyBelongsToCourse('l:html:lesson-01', courses[0])).toBe(true);
    expect(quizKeyBelongsToCourse('l:html:lesson-01', courses[1])).toBe(false);
  });

  it('matches direct legacy lesson and module entities from loaded course data', () => {
    expect(quizKeyBelongsToCourse('l:css-1-1', courses[1])).toBe(true);
    expect(quizKeyBelongsToCourse('m:101', courses[1])).toBe(true);
  });

  it('keeps high-confidence legacy prefixes as a fallback', () => {
    expect(quizKeyBelongsToCourse('l:c5-1', courses[1])).toBe(true);
    expect(quizKeyBelongsToCourse('l:c5-1', courses[0])).toBe(false);
  });

  it('finds stable lesson and module titles for stats rows', () => {
    expect(findQuizEntityTitle('l:html:lesson-01', courses)).toBe('Structure a Page');
    expect(findQuizEntityTitle('m:css:101', courses)).toBe('CSS Basics (Quiz)');
  });
});
