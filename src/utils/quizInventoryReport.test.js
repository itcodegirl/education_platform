import { describe, expect, it } from 'vitest';
import {
  buildQuizInventoryCsv,
  buildQuizInventoryReport,
  getQuizInventoryStatusLabel,
} from './quizInventoryReport';

function makeQuestion() {
  return {
    type: 'mc',
    question: 'Which answer is correct?',
    options: ['A', 'B'],
    correct: 0,
  };
}

describe('quiz inventory report', () => {
  it('summarizes active coverage, reviewed variants, and classified orphan quizzes', () => {
    const report = buildQuizInventoryReport([
      {
        courseMeta: { id: 'html', label: 'HTML' },
        data: {
          modules: [
            {
              id: 'intro',
              title: 'Intro',
              lessons: [{ id: 'lesson-01', title: 'Document structure' }],
            },
          ],
          quizzes: [
            { id: 'primary', lessonId: 'h3-1', questions: [makeQuestion()] },
            { id: 'bonus-a', lessonId: 'h4-1', questions: [makeQuestion()] },
            { id: 'bonus-b', lessonId: 'h4-2', questions: [makeQuestion()] },
            { id: 'bonus-c', lessonId: 'h5-1', questions: [makeQuestion()] },
            { id: 'orphan', lessonId: 'h2-1', questions: [makeQuestion()] },
          ],
        },
      },
    ]);

    expect(report.totals).toMatchObject({
      courseCount: 1,
      lessonCount: 1,
      quizCount: 5,
      activeExpectedLessonsWithNoQuiz: 0,
      orphanLessonQuizzes: 1,
      classifiedOrphanLessonQuizzes: 1,
      unclassifiedOrphanLessonQuizzes: 0,
      lessonVariantGroups: 1,
      intentionalLessonVariantGroups: 1,
      suspiciousLessonVariantGroups: 0,
      blockingIssueCount: 0,
    });
    expect(report.totals.classificationSummary).toEqual([
      { name: 'possible-reuse-later', label: 'Possible reuse', count: 1 },
    ]);
    expect(report.courses[0].orphanLessonQuizzes[0].orphanReview).toMatchObject({
      classification: 'possible-reuse-later',
      label: 'Possible reuse',
    });
  });

  it('exports course-level inventory rows for review outside the app', () => {
    const report = buildQuizInventoryReport([
      {
        courseMeta: { id: 'unknown', label: 'Unknown' },
        data: {
          modules: [
            {
              id: 'basics',
              title: 'Basics',
              lessons: [{ id: 'intro', title: 'Intro' }],
            },
          ],
          quizzes: [],
        },
      },
    ]);

    expect(getQuizInventoryStatusLabel(report.totals.blockingIssueCount)).toBe('1 to review');
    const csv = buildQuizInventoryCsv(report, '2026-05-17T00:00:00.000Z');

    expect(csv).toContain('"course_id","course","lessons","quizzes"');
    expect(csv).toContain('"unknown","Unknown","1","0","1"');
  });
});
