import { describe, expect, it } from 'vitest';
import { getDailyLearningLoopSteps } from './dailyLearningLoop';

describe('daily learning loop', () => {
  it('starts with reading when a lesson is not done', () => {
    const steps = getDailyLearningLoopSteps({ isLessonDone: false });

    expect(steps[0]).toMatchObject({
      key: 'lesson',
      state: 'Start here',
      tone: 'active',
      isCurrent: true,
    });
    expect(steps.filter((step) => step.isCurrent)).toHaveLength(1);
  });

  it('uses mastery guidance to flag quiz review', () => {
    const steps = getDailyLearningLoopSteps({
      isLessonDone: true,
      hasLessonQuiz: true,
      masteryStatus: { tone: 'review', isReady: false },
    });

    expect(steps.find((step) => step.key === 'quiz')).toMatchObject({
      state: 'Review',
      tone: 'attention',
      isCurrent: true,
    });
  });

  it('shows review due count as a retention step', () => {
    const steps = getDailyLearningLoopSteps({
      isLessonDone: true,
      hasLessonQuiz: true,
      masteryStatus: { tone: 'ready', isReady: true },
      dueReviewCount: 3,
    });

    expect(steps.find((step) => step.key === 'review')).toMatchObject({
      state: '3 due',
      tone: 'attention',
      isCurrent: true,
    });
  });

  it('points to application when lesson checks and review are clear', () => {
    const steps = getDailyLearningLoopSteps({
      isLessonDone: true,
      hasLessonQuiz: true,
      masteryStatus: { tone: 'ready', isReady: true },
      dueReviewCount: 0,
    });

    expect(steps.find((step) => step.key === 'apply')).toMatchObject({
      state: 'Challenge',
      isCurrent: true,
    });
  });
});
