import { describe, expect, it } from 'vitest';
import { isLessonUnlocked } from './lessonUnlock';

// The unlock helper is structural; we mock hasLessonCompletion's
// behavior by passing a completedSet that contains lesson_key matches.
// In real code lesson keys are derived from (course.id, module.id,
// lesson.id) — here we shape the lessons so the helper finds them.

const course = { id: 'html' };

const modules = [
  {
    id: 'm1',
    lessons: [
      { id: 'l1' },
      { id: 'l2' },
      { id: 'l3' },
    ],
  },
  {
    id: 'm2',
    lessons: [
      { id: 'l4' },
      { id: 'l5' },
    ],
  },
];

// hasLessonCompletion derives keys from (course.id, module.id,
// lesson.id) — see src/utils/lessonKeys.js. The stable form is
// `c:<courseId>|m:<moduleId>|l:<lessonId>`.
function key(courseId, moduleId, lessonId) {
  return `c:${courseId}|m:${moduleId}|l:${lessonId}`;
}

function setOf(...keys) {
  return new Set(keys);
}

describe('isLessonUnlocked', () => {
  it('always unlocks the first lesson of the first module', () => {
    expect(isLessonUnlocked(course, modules, 0, 0, setOf())).toBe(true);
  });

  it('locks the second lesson when the first is incomplete', () => {
    expect(isLessonUnlocked(course, modules, 0, 1, setOf())).toBe(false);
  });

  it('unlocks the second lesson when the first is complete', () => {
    expect(isLessonUnlocked(course, modules, 0, 1, setOf(key('html', 'm1', 'l1')))).toBe(true);
  });

  it('locks the first lesson of module 2 until the last lesson of module 1 is done', () => {
    expect(isLessonUnlocked(course, modules, 1, 0, setOf())).toBe(false);
    expect(isLessonUnlocked(course, modules, 1, 0, setOf(key('html', 'm1', 'l3')))).toBe(true);
  });

  it('unlocks lessons in module 2 sequentially', () => {
    const completed = setOf(key('html', 'm1', 'l3'), key('html', 'm2', 'l4'));
    expect(isLessonUnlocked(course, modules, 1, 1, completed)).toBe(true);
  });
});
