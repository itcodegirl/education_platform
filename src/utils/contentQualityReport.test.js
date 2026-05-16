import { describe, expect, it } from 'vitest';
import {
  buildContentQualityReport,
  getQuizQualityStatus,
} from './contentQualityReport';

describe('content quality report', () => {
  it('classifies quiz rubric coverage from question shape and prompt text', () => {
    expect(getQuizQualityStatus([
      {
        type: 'bug',
        question: 'Which line has the mistake?',
        lines: ['<h1>Hello</h1>', '<p>Open tag'],
        explanation: 'Debugging asks learners to identify the incorrect line.',
      },
    ])).toEqual({
      misconception: true,
      reasoning: true,
      application: true,
    });
  });

  it('builds actionable admin rows for quiz and lesson gaps', () => {
    const report = buildContentQualityReport([
      {
        courseMeta: { id: 'html', label: 'HTML' },
        data: {
          quizzes: [
            {
              id: 'q1',
              lessonId: 'intro',
              questions: [
                {
                  type: 'mc',
                  question: 'What tag makes a heading?',
                  options: ['h1', 'p'],
                  correct: 0,
                  explanation: 'h1 is a heading.',
                },
              ],
            },
          ],
          modules: [
            {
              id: 'basics',
              title: 'Basics',
              lessons: [
                {
                  id: 'intro',
                  title: 'Intro',
                  content: 'A short note.',
                },
              ],
            },
          ],
        },
      },
    ]);

    expect(report.quizGapCount).toBe(1);
    expect(report.lessonGapCount).toBe(1);
    expect(report.quizGaps[0]).toMatchObject({
      path: 'html.quizzes[0]',
      target: 'Lesson intro',
      missing: ['misconception', 'reasoning', 'application'],
    });
    expect(report.lessonGaps[0]).toMatchObject({
      path: 'html.basics.lessons[0]',
      lessonTitle: 'Intro',
      presentCount: 0,
    });
    expect(report.missingSignals[0].count).toBeGreaterThan(0);
  });
});
