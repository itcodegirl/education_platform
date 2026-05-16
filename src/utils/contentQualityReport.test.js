import { describe, expect, it } from 'vitest';
import {
  buildContentQualityActionPlan,
  buildContentQualityCsv,
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

  it('prioritizes a curriculum sprint from report-only gaps', () => {
    const actionPlan = buildContentQualityActionPlan({
      quizGaps: [{
        courseId: 'html',
        courseLabel: 'HTML',
        target: 'Lesson intro',
        path: 'html.quizzes[0]',
        missing: ['reasoning'],
        missingLabels: ['Reasoning check'],
        suggestion: 'Add a why question.',
      }],
      lessonGaps: [{
        courseId: 'react',
        courseLabel: 'React',
        moduleTitle: 'State',
        lessonTitle: 'useState',
        path: 'react.state.lessons[0]',
        presentCount: 1,
        missing: ['objective', 'retrievalPrompt', 'transfer'],
        missingLabels: ['Clear objective', 'Recall prompt', 'Transfer bridge'],
        suggestion: 'Add a learner-facing goal.',
      }],
    });

    expect(actionPlan.sprintFocus[0]).toMatchObject({
      courseId: 'react',
      totalGaps: 1,
      lessonGaps: 1,
      topSignalLabel: 'Clear objective',
    });
    expect(actionPlan.nextFixes[0]).toMatchObject({
      type: 'lesson',
      label: 'React - useState',
      priority: 6,
    });
  });

  it('exports quiz and lesson gaps as escaped CSV rows', () => {
    const csv = buildContentQualityCsv({
      quizGaps: [{
        courseId: 'html',
        courseLabel: 'HTML',
        target: 'Lesson "intro"',
        path: 'html.quizzes[0]',
        missing: ['reasoning'],
        missingLabels: ['Reasoning check'],
        suggestion: 'Add a why question.',
      }],
      lessonGaps: [{
        courseId: 'css',
        courseLabel: 'CSS',
        moduleTitle: 'Layouts',
        lessonTitle: 'Flex basics',
        path: 'css.layouts.lessons[0]',
        missing: ['transfer', 'retrievalPrompt'],
        missingLabels: ['Transfer bridge', 'Recall prompt'],
        suggestion: 'Add a next-project bridge.',
      }],
    }, '2026-05-16T12:00:00.000Z');

    expect(csv).toContain('"generated_at","type","course_id"');
    expect(csv).toContain('"quiz","html","HTML","Lesson ""intro"""');
    expect(csv).toContain('"lesson","css","CSS","Layouts - Flex basics"');
    expect(csv).toContain('"transfer; retrievalPrompt"');
  });
});
