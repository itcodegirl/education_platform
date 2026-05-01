import { describe, expect, it } from 'vitest';
import { REWARD_EVENT_TYPES } from './rewardEventTypes';
import { createRewardEvent, createRewardEventKey, rewardEventKeys } from './rewardEvents';

describe('rewardEvents', () => {
  it('generates stable lesson completion event keys', () => {
    expect(rewardEventKeys.lessonComplete('lesson-01', 'learner-123')).toBe(
      'lesson-complete:lesson-01:learner-123',
    );
  });

  it('generates stable quiz base event keys', () => {
    expect(rewardEventKeys.quizBase('html:lesson-01', 'learner-123')).toBe(
      'quiz-base:html:lesson-01:learner-123',
    );
  });

  it('generates stable quiz perfect event keys', () => {
    expect(rewardEventKeys.quizPerfect('html:lesson-01', 'learner-123')).toBe(
      'quiz-perfect:html:lesson-01:learner-123',
    );
  });

  it('generates stable challenge completion event keys', () => {
    expect(rewardEventKeys.challengeComplete('challenge-42', 'learner-123')).toBe(
      'challenge-complete:challenge-42:learner-123',
    );
  });

  it('creates traceable reward event records', () => {
    expect(
      createRewardEvent({
        type: REWARD_EVENT_TYPES.LESSON_COMPLETE,
        targetId: 'lesson-01',
        learnerKey: 'learner-123',
        createdAt: '2026-04-25T12:00:00.000Z',
        metadata: { xp: 25 },
      }),
    ).toEqual({
      key: 'lesson-complete:lesson-01:learner-123',
      type: REWARD_EVENT_TYPES.LESSON_COMPLETE,
      targetId: 'lesson-01',
      learnerKey: 'learner-123',
      createdAt: '2026-04-25T12:00:00.000Z',
      metadata: { xp: 25 },
    });
  });

  it('rejects unsupported event types and empty key parts', () => {
    expect(() => createRewardEventKey('NOPE', 'lesson-01', 'learner-123')).toThrow(
      'Unsupported reward event type: NOPE',
    );
    expect(() => rewardEventKeys.lessonComplete('', 'learner-123')).toThrow(
      'reward target id must be a non-empty string',
    );
    expect(() => rewardEventKeys.lessonComplete('lesson-01', '')).toThrow(
      'learner key must be a non-empty string',
    );
  });
});

