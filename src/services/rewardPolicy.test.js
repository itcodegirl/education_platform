import { describe, expect, it } from 'vitest';
import { XP_VALUES } from '../utils/helpers';
import {
  REWARD_EVENT_TYPES,
  REWARD_POLICY,
  REWARD_XP,
  STREAK_QUALIFYING_ACTIONS,
  createRewardKey,
  formatQuizScore,
  isPerfectQuizScore,
  isQuizScoreImprovement,
  isStreakQualifyingAction,
  parseQuizScore,
  quizPercent,
  rewardKeys,
} from './rewardPolicy';

describe('rewardPolicy', () => {
  it('defines stable reward keys for future idempotent reward tracking', () => {
    expect(rewardKeys.lessonComplete('html|module-1|lesson-01')).toBe(
      'lesson_complete:html|module-1|lesson-01',
    );
    expect(rewardKeys.quizComplete('html:lesson-01')).toBe('quiz_complete:html:lesson-01');
    expect(rewardKeys.quizPerfect('html:lesson-01')).toBe('quiz_perfect:html:lesson-01');
    expect(rewardKeys.challengeComplete('challenge-42')).toBe('challenge_complete:challenge-42');
  });

  it('rejects empty reward identifiers and unsupported event types', () => {
    expect(() => rewardKeys.lessonComplete('')).toThrow('reward identifier must be a non-empty string');
    expect(() => createRewardKey('not_supported', 'abc')).toThrow(
      'Unsupported reward event type: not_supported',
    );
  });

  it('keeps reward XP values aligned with the existing XP constants', () => {
    expect(REWARD_XP).toEqual({
      lessonComplete: XP_VALUES.lesson,
      quizComplete: XP_VALUES.quiz,
      quizPerfect: XP_VALUES.perfectQuiz,
      challengeComplete: XP_VALUES.challenge,
    });
  });

  it('documents streak-triggering actions without treating app load as activity', () => {
    expect(STREAK_QUALIFYING_ACTIONS).toEqual([
      REWARD_EVENT_TYPES.lessonComplete,
      REWARD_EVENT_TYPES.quizComplete,
      REWARD_EVENT_TYPES.quizPerfect,
      REWARD_EVENT_TYPES.challengeComplete,
    ]);
    expect(isStreakQualifyingAction(REWARD_EVENT_TYPES.lessonComplete)).toBe(true);
    expect(isStreakQualifyingAction('app_load')).toBe(false);
    expect(REWARD_POLICY.streakRules.appLoadCounts).toBe(false);
  });

  it('states retry and persistence rules for later runtime hardening batches', () => {
    expect(REWARD_POLICY.quizRetryRules).toMatchObject({
      retriesAllowed: true,
      updateBestScore: true,
      repeatBaseXp: false,
      repeatPerfectBonus: false,
    });
    expect(REWARD_POLICY.persistenceRules).toMatchObject({
      rewardCriticalActionsMustBeIdempotent: true,
      failedWritesMustBeVisibleOrRetryable: true,
    });
  });

  it('normalizes quiz score text for best-score and perfect-score decisions', () => {
    expect(formatQuizScore(3, 4)).toBe('3/4');
    expect(parseQuizScore('3/4')).toEqual({ score: 3, total: 4, pct: 75 });
    expect(parseQuizScore('not-a-score')).toBeNull();
    expect(isPerfectQuizScore('4/4')).toBe(true);
    expect(isPerfectQuizScore('3/4')).toBe(false);
    expect(isQuizScoreImprovement(undefined, 3, 4)).toBe(true);
    expect(isQuizScoreImprovement('2/4', 3, 4)).toBe(true);
    expect(isQuizScoreImprovement('3/4', 2, 4)).toBe(false);
  });

  it('quizPercent rounds and returns 0 for malformed totals', () => {
    expect(quizPercent(7, 10)).toBe(70);
    expect(quizPercent(2, 3)).toBe(67);
    expect(quizPercent(1, 3)).toBe(33);
    expect(quizPercent(10, 10)).toBe(100);
    expect(quizPercent(0, 10)).toBe(0);

    // Defensive cases — both quiz paths route through this helper
    // instead of inlining Math.round((score / 0) * 100), so a
    // malformed quiz can never render NaN%.
    expect(quizPercent(0, 0)).toBe(0);
    expect(quizPercent(1, 0)).toBe(0);
    expect(quizPercent(1, -3)).toBe(0);
    expect(quizPercent(Number.NaN, 10)).toBe(0);
    expect(quizPercent(5, Number.POSITIVE_INFINITY)).toBe(0);
  });
});
