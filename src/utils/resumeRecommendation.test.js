import { describe, expect, it } from 'vitest';
import { getResumeRecommendation } from './resumeRecommendation';

const htmlCourse = {
  id: 'html',
  label: 'HTML',
  icon: 'H',
  modules: [
    {
      id: 'basics',
      title: 'Basics',
      emoji: 'B',
      lessons: [
        { id: 'intro', title: 'Intro' },
        { id: 'forms', title: 'Forms' },
      ],
    },
    {
      id: 'semantics',
      title: 'Semantics',
      emoji: 'S',
      lessons: [
        { id: 'landmarks', title: 'Landmarks' },
      ],
    },
  ],
};

const cssCourse = {
  id: 'css',
  label: 'CSS',
  icon: 'C',
  modules: [
    {
      id: 'layout',
      title: 'Layout',
      emoji: 'L',
      lessons: [
        { id: 'grid', title: 'Grid' },
      ],
    },
  ],
};

const courses = [htmlCourse, cssCourse];

function makeContext(overrides = {}) {
  return {
    courses,
    course: htmlCourse,
    moduleData: htmlCourse.modules[0],
    lesson: htmlCourse.modules[0].lessons[0],
    courseIndex: 0,
    moduleIndex: 0,
    lessonIndex: 0,
    completedSet: new Set(),
    hasLessonQuiz: false,
    lessonQuizScore: '',
    dueReviewCount: 0,
    bookmarks: [],
    lastPosition: null,
    ...overrides,
  };
}

describe('resume recommendation', () => {
  it('prioritizes due review cards before new material', () => {
    const recommendation = getResumeRecommendation(makeContext({
      dueReviewCount: 3,
      bookmarks: [{ lesson_key: 'c:html|m:basics|l:forms' }],
    }));

    expect(recommendation).toMatchObject({
      type: 'review',
      action: 'review',
      title: '3 review cards are ready',
      cta: 'Review now',
    });
  });

  it('points a completed lesson with weak quiz evidence back to the quiz', () => {
    const recommendation = getResumeRecommendation(makeContext({
      completedSet: new Set(['c:html|m:basics|l:intro']),
      hasLessonQuiz: true,
      lessonQuizScore: '3/5',
    }));

    expect(recommendation).toMatchObject({
      type: 'quiz',
      action: 'quiz',
      title: 'Retake the quick check: 60%',
      cta: 'Jump to quiz',
      path: '/learn/html/basics/intro',
    });
  });

  it('resumes a saved position when it is unfinished and away from the current lesson', () => {
    const recommendation = getResumeRecommendation(makeContext({
      lastPosition: {
        courseId: 'html',
        moduleId: 'basics',
        lessonId: 'forms',
      },
    }));

    expect(recommendation).toMatchObject({
      type: 'saved',
      action: 'lesson',
      courseIndex: 0,
      moduleIndex: 0,
      lessonIndex: 1,
      title: 'Resume Forms',
    });
  });

  it('uses the newest unfinished bookmark when there is no saved lesson', () => {
    const recommendation = getResumeRecommendation(makeContext({
      completedSet: new Set(['c:html|m:basics|l:intro']),
      bookmarks: [
        {
          lesson_key: 'c:css|m:layout|l:grid',
          created_at: '2026-01-01T12:00:00.000Z',
        },
        {
          lesson_key: 'c:html|m:semantics|l:landmarks',
          created_at: '2026-02-01T12:00:00.000Z',
        },
      ],
    }));

    expect(recommendation).toMatchObject({
      type: 'bookmark',
      action: 'lesson',
      courseId: 'html',
      moduleId: 'semantics',
      lessonId: 'landmarks',
      cta: 'Open bookmark',
    });
  });

  it('falls forward to the next incomplete lesson in the active course', () => {
    const recommendation = getResumeRecommendation(makeContext({
      completedSet: new Set(['c:html|m:basics|l:intro']),
    }));

    expect(recommendation).toMatchObject({
      type: 'next',
      action: 'lesson',
      moduleIndex: 0,
      lessonIndex: 1,
      title: 'Forms',
      cta: 'Start lesson',
    });
  });

  it('keeps the learner on the current lesson when no stronger cue exists', () => {
    const recommendation = getResumeRecommendation(makeContext());

    expect(recommendation).toMatchObject({
      type: 'current',
      action: 'current',
      title: 'Keep going: Intro',
      cta: 'Back to lesson',
    });
  });
});
