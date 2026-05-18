import { describe, expect, it } from 'vitest';
import {
  buildContentQualityActionPlan,
  buildContentQualityCsv,
  buildContentQualityFixCsv,
  buildContentQualityReport,
  getContentQualityFixTemplates,
  getContentQualitySignalLabel,
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
    expect(report.quizGaps[0].fixTemplates[0]).toMatchObject({
      signal: 'misconception',
      title: 'Misconception quiz item',
    });
    expect(report.lessonGaps[0]).toMatchObject({
      path: 'html.basics.lessons[0]',
      lessonTitle: 'Intro',
      presentCount: 0,
    });
    expect(report.lessonGaps[0].fixTemplates[0]).toMatchObject({
      signal: 'objective',
      title: 'Learning target',
    });
    expect(report.missingSignals[0].count).toBeGreaterThan(0);
  });

  it('provides reusable labels and fix templates for missing signals', () => {
    expect(getContentQualitySignalLabel('retrievalPrompt')).toBe('Recall prompt');
    expect(getContentQualityFixTemplates(['transfer', 'transfer', 'reasoning'])).toEqual([
      expect.objectContaining({
        signal: 'transfer',
        title: 'Transfer bridge',
      }),
      expect.objectContaining({
        signal: 'reasoning',
        title: 'Predict/explain quiz item',
      }),
    ]);
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
    expect(actionPlan.allFixes).toHaveLength(2);
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

  it('exports filtered priority fixes with starter templates', () => {
    const csv = buildContentQualityFixCsv([{
      type: 'quiz',
      priority: 3,
      courseId: 'react',
      courseLabel: 'React',
      label: 'React - Lesson "r10-1"',
      path: 'react.quizzes[19]',
      missing: ['misconception', 'reasoning', 'application'],
      missingLabels: ['Misconception check', 'Reasoning check', 'Application scenario'],
      suggestion: 'Add one question.',
      fixTemplates: [{
        title: 'Misconception quiz item',
        template: 'Ask learners to choose the bug.',
      }],
    }], '2026-05-16T12:00:00.000Z');

    expect(csv).toContain('"generated_at","priority","type"');
    expect(csv).toContain('"3","quiz","react","React","React - Lesson ""r10-1"""');
    expect(csv).toContain('"misconception; reasoning; application"');
    expect(csv).toContain('"Misconception quiz item","Ask learners to choose the bug."');
  });
});


// ─── getLessonQualityStatus (direct signal tests) ─────────────────────────────

import { getLessonQualityStatus } from './contentQualityReport';

describe('getLessonQualityStatus — objective signal', () => {
  it('present when hook.accomplishments is a non-empty array', () => {
    expect(getLessonQualityStatus({ hook: { accomplishments: ['Build a nav'] } }).objective).toBe(true);
  });

  it('present when learningFrame.learn is a non-empty string', () => {
    expect(getLessonQualityStatus({ learningFrame: { learn: 'Use flexbox' } }).objective).toBe(true);
  });

  it('present when build.goal is a non-empty string', () => {
    expect(getLessonQualityStatus({ build: { goal: 'Style a card' } }).objective).toBe(true);
  });

  it('absent when none of the objective fields exist', () => {
    expect(getLessonQualityStatus({}).objective).toBe(false);
  });
});

describe('getLessonQualityStatus — misconceptionCheck signal', () => {
  it('present when understand.commonMistakes is a non-empty array', () => {
    expect(getLessonQualityStatus({ understand: { commonMistakes: ['Forgetting to close tags'] } }).misconceptionCheck).toBe(true);
  });

  it('present when lesson.commonMistakes is a non-empty array', () => {
    expect(getLessonQualityStatus({ commonMistakes: ['Off-by-one'] }).misconceptionCheck).toBe(true);
  });

  it('present when task or concept text contains a trigger keyword', () => {
    expect(getLessonQualityStatus({ tasks: ['Watch out for this common mistake'] }).misconceptionCheck).toBe(true);
    expect(getLessonQualityStatus({ content: 'Avoid this common error in your code' }).misconceptionCheck).toBe(true);
  });

  it('absent when no misconception signals exist', () => {
    expect(getLessonQualityStatus({ tasks: ['Build a form'] }).misconceptionCheck).toBe(false);
  });
});

describe('getLessonQualityStatus — retrievalPrompt signal', () => {
  it('present when learningFrame.check is a non-empty string', () => {
    expect(getLessonQualityStatus({ learningFrame: { check: 'What does flex do?' } }).retrievalPrompt).toBe(true);
  });

  it('present when task text contains a recall trigger word', () => {
    expect(getLessonQualityStatus({ tasks: ['Try to recall the three box model layers'] }).retrievalPrompt).toBe(true);
    expect(getLessonQualityStatus({ tasks: ['Explain what display:flex does without looking'] }).retrievalPrompt).toBe(true);
  });

  it('absent when no retrieval signals exist', () => {
    expect(getLessonQualityStatus({ tasks: ['Build a card component'] }).retrievalPrompt).toBe(false);
  });
});

describe('getLessonQualityStatus — guidedPractice signal', () => {
  it('present when lesson.code is a non-empty string', () => {
    expect(getLessonQualityStatus({ code: '.box { display: flex; }' }).guidedPractice).toBe(true);
  });

  it('present when do.steps is a non-empty array', () => {
    expect(getLessonQualityStatus({ do: { steps: ['Step 1', 'Step 2'] } }).guidedPractice).toBe(true);
  });

  it('present when do.code is a non-empty string', () => {
    expect(getLessonQualityStatus({ do: { code: 'const x = 1;' } }).guidedPractice).toBe(true);
  });

  it('absent when no guided practice fields exist', () => {
    expect(getLessonQualityStatus({}).guidedPractice).toBe(false);
  });
});

describe('getLessonQualityStatus — independentPractice signal', () => {
  it('present when challenge is a non-empty string', () => {
    expect(getLessonQualityStatus({ challenge: 'Build a nav from scratch' }).independentPractice).toBe(true);
  });

  it('present when challenge.mission is a non-empty string', () => {
    expect(getLessonQualityStatus({ challenge: { mission: 'Style a button' } }).independentPractice).toBe(true);
  });

  it('present when challenge.requirements is a non-empty array', () => {
    expect(getLessonQualityStatus({ challenge: { requirements: ['Must use flexbox'] } }).independentPractice).toBe(true);
  });

  it('present when build.goal is a non-empty string', () => {
    expect(getLessonQualityStatus({ build: { goal: 'Build a card' } }).independentPractice).toBe(true);
  });

  it('present when do.steps is a non-empty array', () => {
    expect(getLessonQualityStatus({ do: { steps: ['Do this'] } }).independentPractice).toBe(true);
  });

  it('absent when no practice fields exist', () => {
    expect(getLessonQualityStatus({}).independentPractice).toBe(false);
  });
});

describe('getLessonQualityStatus — transfer signal', () => {
  it('present when bridge.preview is a non-empty string', () => {
    expect(getLessonQualityStatus({ bridge: { preview: 'Next lesson: animations' } }).transfer).toBe(true);
  });

  it('present when learningFrame.next is a non-empty string', () => {
    expect(getLessonQualityStatus({ learningFrame: { next: 'Use this in your portfolio' } }).transfer).toBe(true);
  });

  it('present when task text contains a transfer keyword', () => {
    expect(getLessonQualityStatus({ tasks: ['Apply this to your portfolio project'] }).transfer).toBe(true);
    expect(getLessonQualityStatus({ tasks: ['This is a real-world pattern'] }).transfer).toBe(true);
  });

  it('absent when no transfer signals exist', () => {
    expect(getLessonQualityStatus({ tasks: ['Complete the quiz'] }).transfer).toBe(false);
  });
});

describe('getLessonQualityStatus — null/undefined lesson', () => {
  it('returns all-false for an empty object', () => {
    const status = getLessonQualityStatus({});
    expect(Object.values(status).every((v) => v === false)).toBe(true);
  });

  it('returns all-false for null without throwing', () => {
    const status = getLessonQualityStatus(null);
    expect(Object.values(status).every((v) => v === false)).toBe(true);
  });

  it('returns all-false for undefined without throwing', () => {
    const status = getLessonQualityStatus(undefined);
    expect(Object.values(status).every((v) => v === false)).toBe(true);
  });
});
