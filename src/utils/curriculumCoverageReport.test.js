import { describe, expect, it } from 'vitest';
import {
  buildCurriculumCoverageCsv,
  buildCurriculumCoverageReport,
  getCurriculumCoverageStatusLabel,
} from './curriculumCoverageReport';

function makeStrongLesson(overrides = {}) {
  return {
    id: 'intro',
    title: 'Intro',
    hook: { accomplishments: ['Build a semantic section'] },
    learningFrame: {
      learn: 'Use this skill in a page section.',
      check: 'Explain the pattern without looking.',
      next: 'Apply it to a portfolio project.',
    },
    code: '<section><h1>Hello</h1></section>',
    challenge: { mission: 'Build one section from scratch', requirements: ['Use a heading'] },
    understand: { commonMistakes: ['Avoid using headings only for size.'] },
    bridge: { preview: 'Use this in the next project page.' },
    ...overrides,
  };
}

function makeStrongQuiz(overrides = {}) {
  return {
    id: 'intro-quiz',
    lessonId: 'intro',
    questions: [
      {
        id: 'q1',
        type: 'bug',
        question: 'In this real project scenario, which line has the mistake and why?',
        lines: ['<h1>Title</h1>', '<p>Body</p>'],
        correct: 0,
        explanation: 'The learner must debug the tempting answer because structure matters.',
      },
    ],
    ...overrides,
  };
}

describe('curriculum coverage report', () => {
  it('maps lessons to quiz, practice, project evidence, and rubric gaps', () => {
    const report = buildCurriculumCoverageReport([
      {
        courseMeta: { id: 'html', label: 'HTML' },
        data: {
          modules: [
            {
              id: 'basics',
              title: 'Basics',
              lessons: [makeStrongLesson()],
            },
            {
              id: 'layout',
              title: 'Layout',
              lessons: [{ id: 'layout-1', title: 'Layout 1', content: 'Short note.' }],
            },
          ],
          quizzes: [makeStrongQuiz()],
          challenges: [
            {
              id: 'project-1',
              title: 'Build a section',
              recommendedModuleId: 'basics',
            },
          ],
        },
      },
    ], {
      projectsByCourse: {
        html: [{ title: 'Portfolio page' }],
      },
    });

    expect(report.totals).toMatchObject({
      courseCount: 1,
      moduleCount: 2,
      lessonCount: 2,
      quizCount: 1,
      challengeCount: 1,
      projectIdeaCount: 1,
      readyLessonCount: 1,
    });
    expect(report.courses[0]).toMatchObject({
      lessonCoveragePercent: 50,
      quizCoveragePercent: 50,
      practiceCoveragePercent: 50,
      projectEvidenceCoveragePercent: 50,
      modulesWithProjectEvidence: 1,
    });
    expect(report.lessons.find((lesson) => lesson.lessonId === 'intro')).toMatchObject({
      ready: true,
      hasQuizCoverage: true,
      hasPractice: true,
      hasProjectEvidence: true,
      missing: [],
    });

    const layoutLesson = report.lessons.find((lesson) => lesson.lessonId === 'layout-1');
    expect(layoutLesson.missing).toEqual([
      'lessonQuiz',
      'practicePrompt',
      'projectEvidence',
      'lessonRubric',
    ]);
    expect(report.gapsByType.map((entry) => entry.name)).toEqual([
      'lessonQuiz',
      'projectEvidence',
      'lessonRubric',
      'practicePrompt',
    ]);
    expect(getCurriculumCoverageStatusLabel(report.courses[0].gapCount)).toBe('4 to map');
  });

  it('exports coverage gaps for external review', () => {
    const report = buildCurriculumCoverageReport([
      {
        courseMeta: { id: 'css', label: 'CSS' },
        data: {
          modules: [
            {
              id: 'selectors',
              title: 'Selectors',
              lessons: [{ id: 'selectors-1', title: 'Selectors 1', content: 'Short note.' }],
            },
          ],
          quizzes: [],
          challenges: [],
        },
      },
    ]);

    const csv = buildCurriculumCoverageCsv(report, '2026-05-17T00:00:00.000Z');

    expect(csv).toContain('"course_id","course","module_id","module","lesson_id","lesson"');
    expect(csv).toContain('"css","CSS","selectors","Selectors","selectors-1","Selectors 1","lessonQuiz"');
    expect(csv).toContain('"projectEvidence","Challenge/project evidence"');
  });
});
