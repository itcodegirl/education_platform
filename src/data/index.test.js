import { afterEach, describe, expect, it } from 'vitest';
import {
  COURSES,
  QUIZ_MAP,
  QUIZ_VARIANTS,
  getLoadedCourse,
  getQuiz,
  getQuizVariants,
  hasQuiz,
  hydrateLoadedCourse,
} from './index';

const EMPTY_POSITION = { modules: [] };

function resetCourseContentState() {
  COURSES.forEach((course) => {
    course.modules = [];
  });
  QUIZ_MAP.clear();
  QUIZ_VARIANTS.clear();
}

afterEach(() => {
  resetCourseContentState();
});

describe('data selectors', () => {
  it('returns null until a course has been hydrated', () => {
    resetCourseContentState();

    expect(getLoadedCourse('html')).toBeNull();
    expect(getQuiz('html', 'l', 'lesson-1')).toBeUndefined();
    expect(getQuizVariants('html', 'l', 'lesson-1')).toBeNull();
  });

  it('hydrates scoped quiz lookups through the selector layer', () => {
    const modules = [
      {
        id: 'foundations',
        title: 'Foundations',
        lessons: [
          { id: 'lesson-1', title: 'Lesson One' },
        ],
      },
    ];
    const primaryQuiz = { id: 'quiz-primary', lessonId: 'lesson-1', moduleId: 'foundations' };
    const bonusQuiz = { id: 'quiz-bonus', lessonId: 'lesson-1', moduleId: 'foundations' };

    const loadedCourse = hydrateLoadedCourse('html', {
      modules,
      quizzes: [primaryQuiz, bonusQuiz],
    });

    expect(loadedCourse).not.toMatchObject(EMPTY_POSITION);
    expect(getLoadedCourse('html')?.modules).toEqual(modules);
    expect(getQuiz('html', 'l', 'lesson-1')).toBe(primaryQuiz);
    expect(getQuiz('html', 'm', 'foundations')).toBe(primaryQuiz);
    expect(hasQuiz('html', 'm', 'foundations')).toBe(true);
    expect(getQuizVariants('html', 'l', 'lesson-1')).toEqual({
      primary: primaryQuiz,
      bonus: [bonusQuiz],
    });
  });

  it('clears stale scoped quiz entries when a course is re-hydrated', () => {
    hydrateLoadedCourse('html', {
      modules: [
        {
          id: 'foundations',
          title: 'Foundations',
          lessons: [{ id: 'lesson-1', title: 'Lesson One' }],
        },
      ],
      quizzes: [{ id: 'quiz-old', lessonId: 'lesson-1', moduleId: 'foundations' }],
    });

    hydrateLoadedCourse('html', {
      modules: [
        {
          id: 'advanced',
          title: 'Advanced',
          lessons: [{ id: 'lesson-2', title: 'Lesson Two' }],
        },
      ],
      quizzes: [{ id: 'quiz-new', lessonId: 'lesson-2', moduleId: 'advanced' }],
    });

    expect(getQuiz('html', 'l', 'lesson-1')).toBeUndefined();
    expect(hasQuiz('html', 'm', 'foundations')).toBe(false);
    expect(getQuiz('html', 'l', 'lesson-2')?.id).toBe('quiz-new');
    expect(getLoadedCourse('html')?.modules[0]?.id).toBe('advanced');
  });
});
