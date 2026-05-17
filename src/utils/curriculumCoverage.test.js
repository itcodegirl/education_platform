import { describe, expect, it } from 'vitest';
import {
  REVIEW_STATUS,
  buildCurriculumCoverage,
  coverageToCsv,
} from './curriculumCoverage';

const BASE_COURSE = {
  id: 'html',
  label: 'HTML',
  icon: '*',
  accent: '#ff6b9d',
  modules: [
    {
      id: 'm1',
      title: 'Foundations',
      lessons: [
        {
          id: 'l1',
          title: 'Markup basics',
          summary: { capabilities: ['Write a valid HTML document'] },
          do: { steps: ['Create index.html'], proofRequired: 'working page' },
          build: { hint: 'Refresh after saving.' },
          challenge: {
            title: 'About page',
            requirements: ['Use one h1', 'Use three paragraphs'],
          },
        },
      ],
    },
  ],
};

describe('buildCurriculumCoverage', () => {
  it('marks a lesson complete when quiz, project, rubric, objectives, practice, and support are present', () => {
    const matrix = buildCurriculumCoverage([BASE_COURSE], {
      getQuizVariants: () => ({
        primary: {
          questions: [{ id: 'q1' }, { id: 'q2' }],
        },
        bonus: [],
      }),
    });

    expect(matrix.totals.totalLessons).toBe(1);
    expect(matrix.totals.complete).toBe(1);
    expect(matrix.lessonRows[0]).toMatchObject({
      status: REVIEW_STATUS.complete,
      gaps: [],
    });
    expect(matrix.courseRows[0].lessonQuizCount).toBe(1);
    expect(matrix.courseRows[0].rubricCount).toBe(1);
  });

  it('flags missing assessment separately from other learning quality gaps', () => {
    const course = {
      ...BASE_COURSE,
      modules: [
        {
          id: 'm1',
          title: 'Foundations',
          lessons: [{ id: 'l1', title: 'Empty shell' }],
        },
      ],
    };

    const matrix = buildCurriculumCoverage([course]);
    const row = matrix.lessonRows[0];

    expect(row.status).toBe(REVIEW_STATUS.missingAssessment);
    expect(row.gaps).toEqual(expect.arrayContaining([
      'missingQuiz',
      'missingProject',
      'missingRubric',
      'missingObjectives',
      'missingPractice',
      'missingSupportNotes',
    ]));
  });

  it('keeps structural alignment warnings when quizzes or projects lack explicit maps', () => {
    const course = {
      ...BASE_COURSE,
      modules: [
        {
          id: 'm1',
          title: 'Foundations',
          lessons: [
            {
              id: 'l1',
              title: 'Concept-only lesson',
              concepts: ['A concept exists, but no explicit objective does.'],
              tasks: ['Try it'],
              challenge: 'Build a tiny demo',
              hint: 'Use the starter file.',
            },
          ],
        },
      ],
    };

    const matrix = buildCurriculumCoverage([course], {
      getQuizVariants: () => ({ primary: { questions: [{ id: 'q1' }] }, bonus: [] }),
    });

    expect(matrix.lessonRows[0].status).toBe(REVIEW_STATUS.needsReview);
    expect(matrix.lessonRows[0].gaps).toEqual(expect.arrayContaining([
      'missingRubric',
      'missingObjectives',
      'quizObjectiveAlignment',
      'projectRubricAlignment',
    ]));
  });
});

describe('coverageToCsv', () => {
  it('exports lesson rows with escaped gap labels', () => {
    const matrix = buildCurriculumCoverage([BASE_COURSE]);
    const csv = coverageToCsv(matrix);

    expect(csv).toContain('Status,Course,Module,Lesson');
    expect(csv).toContain('Missing assessment,HTML,Foundations,Markup basics,l1');
    expect(csv).toContain('Missing quiz');
  });
});
