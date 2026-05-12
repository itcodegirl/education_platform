import { describe, expect, it } from 'vitest';
import {
  FIRST_SESSION_STEPS,
  LEARNING_EVIDENCE_STEPS,
  getMomentumGuidancePoints,
} from './learnerContract';

describe('learner contract copy', () => {
  it('keeps first-session guidance narrow and progress-specific', () => {
    expect(FIRST_SESSION_STEPS).toEqual([
      'Read the goal and what you are building.',
      'Try the example and compare the result.',
      'Use Complete lesson to save reading progress.',
    ]);
  });

  it('separates completion from mastery evidence', () => {
    expect(LEARNING_EVIDENCE_STEPS[0]).toMatchObject({
      key: 'completion',
      detail: expect.stringContaining('does not claim mastery'),
    });
    expect(LEARNING_EVIDENCE_STEPS.map((step) => step.key)).toEqual([
      'completion',
      'quick-check',
      'review',
      'apply',
    ]);
  });

  it('keeps momentum guidance focused on one next proof step', () => {
    expect(getMomentumGuidancePoints()).toEqual([
      'If a quick check appears, use it to confirm what stuck.',
      'If review is due, clear the short queue before adding more new material.',
      'If everything is clear, try one small challenge to prove the skill.',
    ]);
  });
});
