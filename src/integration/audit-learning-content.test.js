import { describe, expect, it } from 'vitest';
import { analyzeLearningContent } from '../../scripts/audit-learning-content.mjs';

const courseMetadata = [
  { id: 'html', label: 'HTML', accent: '#f97316' },
  { id: 'css', label: 'CSS', accent: '#38bdf8' },
  { id: 'js', label: 'JavaScript', accent: '#facc15' },
  { id: 'react', label: 'React', accent: '#61dafb' },
];

function makeLesson(id, overrides = {}) {
  return {
    id,
    title: `Lesson ${id}`,
    duration: '10 min',
    content: `Content for ${id}`,
    do: {
      steps: ['Build the smallest useful version.'],
    },
    ...overrides,
  };
}

function makeCourse(courseId, lessons) {
  return {
    courseMeta: { id: courseId },
    data: {
      modules: [
        {
          id: `${courseId}-m1`,
          title: `${courseId.toUpperCase()} Basics`,
          lessons,
        },
      ],
      quizzes: [],
      challenges: [],
    },
  };
}

function makeFixture(overrides = {}) {
  return {
    courseMetadata,
    loaded: [
      makeCourse('html', [
        makeLesson('html-1-1'),
        makeLesson('html-1-2', overrides.htmlSecondLesson || {}),
      ]),
      makeCourse('css', [makeLesson('css-1-1')]),
      makeCourse('js', [makeLesson('js-1-1')]),
      makeCourse('react', [makeLesson('react-1-1')]),
    ],
  };
}

describe('learning content audit', () => {
  it('accepts explicit cross-course bridge handoffs', () => {
    const fixture = makeFixture({
      htmlSecondLesson: {
        bridge: {
          nextCourseId: 'css',
          nextLessonId: 'css-1-1',
        },
      },
    });

    const result = analyzeLearningContent(fixture);

    expect(result.issues).toEqual([]);
    expect(result.counts).toMatchObject({
      courses: 4,
      modules: 4,
      lessons: 5,
    });
  });

  it('flags stale cross-course lesson references unless the target course is explicit', () => {
    const fixture = makeFixture({
      htmlSecondLesson: {
        bridge: {
          nextLessonId: 'css-1-1',
        },
      },
    });

    const result = analyzeLearningContent(fixture);

    expect(result.issues).toContainEqual({
      path: 'html.html-m1.lessons[1]',
      message: 'Bridge nextLessonId "css-1-1" points outside html; add nextCourseId for an explicit cross-course handoff.',
    });
  });

  it('flags missing learner-critical lesson and challenge structure', () => {
    const fixture = makeFixture();
    fixture.loaded[0].data.modules[0].lessons[0] = {
      id: 'html-1-1',
      title: 'Missing duration and content',
    };
    fixture.loaded[0].data.challenges = [
      {
        id: 'html-challenge-1',
        courseId: 'html',
        title: 'Build a page',
        tests: [{ id: 'renders-heading' }],
      },
    ];

    const result = analyzeLearningContent(fixture);

    expect(result.issues).toEqual(expect.arrayContaining([
      {
        path: 'html.html-m1.lessons[0]',
        message: 'Lesson is missing a duration or metadata.estimatedTime signal.',
      },
      {
        path: 'html.html-m1.lessons[0]',
        message: 'Lesson is missing learner-facing content blocks.',
      },
      {
        path: 'html.challenges[0]',
        message: 'Challenge is missing requirements.',
      },
    ]));
  });
});
