import { describe, expect, it } from 'vitest';
import { getRetentionPlan } from './retentionPlan';

describe('retention plan', () => {
  it('waits until the learner has a lesson attempt to reinforce', () => {
    expect(getRetentionPlan({ isLessonDone: false })).toMatchObject({
      state: 'After lesson',
      tone: 'neutral',
      isRecallCurrent: false,
    });
  });

  it('turns a ready quiz signal into a short recall prompt', () => {
    expect(getRetentionPlan({
      isLessonDone: true,
      hasLessonQuiz: true,
      masteryStatus: { tone: 'ready', isReady: true },
      dueReviewCount: 0,
    })).toMatchObject({
      state: '1-minute recall',
      tone: 'active',
      isRecallCurrent: true,
    });
  });

  it('prioritizes due review over new recall prompts', () => {
    expect(getRetentionPlan({
      isLessonDone: true,
      hasLessonQuiz: true,
      masteryStatus: { tone: 'ready', isReady: true },
      dueReviewCount: 2,
    })).toMatchObject({
      state: 'Review first',
      tone: 'attention',
      isRecallCurrent: false,
    });
  });
});
