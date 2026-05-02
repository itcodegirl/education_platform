import { describe, it, expect } from 'vitest';
import {
  getLessonPositionLabel,
  getNextLessonTitle,
  getNextStepHint,
  getPrevLessonTitle,
} from './lessonNavCopy';

const lesson = (id, title) => ({ id, title });
const mod = (id, title, lessons) => ({ id, title, lessons });

describe('getPrevLessonTitle', () => {
  const modules = [
    mod('m1', 'Intro', [lesson('l1', 'A'), lesson('l2', 'B')]),
    mod('m2', 'Next', [lesson('l3', 'C')]),
  ];

  it('returns the previous lesson within the same module', () => {
    const m = modules[0];
    expect(
      getPrevLessonTitle({ isFirst: false, showModQuiz: false, modIdx: 0, lesIdx: 1, mod: m, modules }),
    ).toBe('A');
  });

  it('crosses to the last lesson of the previous module on the first lesson of a later module', () => {
    const m = modules[1];
    expect(
      getPrevLessonTitle({ isFirst: false, showModQuiz: false, modIdx: 1, lesIdx: 0, mod: m, modules }),
    ).toBe('B');
  });

  it('returns null on the first lesson of the first module', () => {
    expect(
      getPrevLessonTitle({ isFirst: true, showModQuiz: false, modIdx: 0, lesIdx: 0, mod: modules[0], modules }),
    ).toBeNull();
  });

  it('returns null on a module quiz', () => {
    expect(
      getPrevLessonTitle({ isFirst: false, showModQuiz: true, modIdx: 0, lesIdx: 1, mod: modules[0], modules }),
    ).toBeNull();
  });
});

describe('getNextLessonTitle', () => {
  const modules = [
    mod('m1', 'Intro', [lesson('l1', 'A'), lesson('l2', 'B')]),
    mod('m2', 'Next', [lesson('l3', 'C')]),
  ];

  it('returns the next lesson in the current module', () => {
    expect(
      getNextLessonTitle({
        isLast: false,
        isLastLesson: false,
        moduleQuiz: null,
        showModQuiz: false,
        modIdx: 0,
        lesIdx: 0,
        mod: modules[0],
        modules,
      }),
    ).toBe('B');
  });

  it('points at the module quiz when on the last lesson of a module that has one', () => {
    expect(
      getNextLessonTitle({
        isLast: false,
        isLastLesson: true,
        moduleQuiz: { id: 'q1' },
        showModQuiz: false,
        modIdx: 0,
        lesIdx: 1,
        mod: modules[0],
        modules,
      }),
    ).toBe('Intro Quiz');
  });

  it('returns null at the end of the track', () => {
    expect(
      getNextLessonTitle({
        isLast: true,
        isLastLesson: true,
        moduleQuiz: null,
        showModQuiz: false,
        modIdx: 1,
        lesIdx: 0,
        mod: modules[1],
        modules,
      }),
    ).toBeNull();
  });

  it('after a module quiz, points at the first lesson of the next module', () => {
    expect(
      getNextLessonTitle({
        isLast: false,
        isLastLesson: true,
        moduleQuiz: { id: 'q1' },
        showModQuiz: true,
        modIdx: 0,
        lesIdx: 1,
        mod: modules[0],
        modules,
      }),
    ).toBe('C');
  });
});

describe('getNextStepHint', () => {
  it('matches the four user-facing states', () => {
    expect(getNextStepHint({ isLast: true, showModQuiz: false, isDone: true })).toMatch(/Track complete/);
    expect(getNextStepHint({ isLast: false, showModQuiz: true, isDone: false })).toMatch(/Finish this quiz/);
    expect(getNextStepHint({ isLast: false, showModQuiz: false, isDone: false })).toMatch(/Mark this lesson done/);
    expect(getNextStepHint({ isLast: false, showModQuiz: false, isDone: true })).toMatch(/Nice progress/);
  });
});

describe('getLessonPositionLabel', () => {
  it('shows the lesson index out of total', () => {
    expect(getLessonPositionLabel({ showModQuiz: false, modTitle: 'A', lesIdx: 0, lessonsLength: 3 })).toBe(
      'Lesson 1 of 3',
    );
  });

  it('uses the module quiz label when on the quiz', () => {
    expect(getLessonPositionLabel({ showModQuiz: true, modTitle: 'A', lesIdx: 0, lessonsLength: 3 })).toBe(
      'Module quiz for A',
    );
  });
});
