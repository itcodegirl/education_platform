// ═══════════════════════════════════════════════
// Unit tests for the learning engine factory.
//
// createLearningEngine takes a dependency bag and
// returns a small orchestrator. We pass in Vitest
// mocks and assert that the right dependencies fire
// on each action — no real Supabase, no real React.
// ═══════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLearningEngine } from './learningEngine';
import { rewardKeys } from './rewardPolicy';

function buildDeps(overrides = {}) {
  return {
    toggleLesson: vi.fn(),
    saveQuizScore: vi.fn(),
    quizScores: {},
    awardXP: vi.fn(),
    recordDailyActivity: vi.fn(),
    completedSet: new Set(),
    hasRewardBeenAwarded: vi.fn(() => false),
    markRewardAwarded: vi.fn(() => true),
    isChallengeCompleted: vi.fn(() => false),
    markChallengeCompleted: vi.fn(() => true),
    ...overrides,
  };
}

describe('createLearningEngine → completeLesson', () => {
  it('marks a new lesson done, awards XP, and records daily activity', () => {
    const deps = buildDeps();
    const engine = createLearningEngine(deps);

    engine.completeLesson('html|intro|first');

    expect(deps.toggleLesson).toHaveBeenCalledTimes(1);
    expect(deps.toggleLesson).toHaveBeenCalledWith('html|intro|first', {});
    expect(deps.markRewardAwarded).toHaveBeenCalledWith(
      rewardKeys.lessonComplete('html|intro|first'),
    );
    expect(deps.awardXP).toHaveBeenCalledTimes(1);
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed'); // XP_VALUES.lesson
    expect(deps.recordDailyActivity).toHaveBeenCalledTimes(1);
  });

  it('toggles a completed lesson OFF without awarding XP again', () => {
    const deps = buildDeps({
      completedSet: new Set(['html|intro|first']),
    });
    const engine = createLearningEngine(deps);

    engine.completeLesson('html|intro|first');

    expect(deps.toggleLesson).toHaveBeenCalledTimes(1);
    expect(deps.awardXP).not.toHaveBeenCalled();
    expect(deps.recordDailyActivity).not.toHaveBeenCalled();
  });

  it('does not award XP again when a previously rewarded lesson is recompleted', () => {
    const deps = buildDeps({
      completedSet: new Set(),
      hasRewardBeenAwarded: vi.fn(() => true),
    });
    const engine = createLearningEngine(deps);

    engine.completeLesson('html|intro|first');

    expect(deps.toggleLesson).toHaveBeenCalledTimes(1);
    expect(deps.toggleLesson).toHaveBeenCalledWith('html|intro|first', {});
    expect(deps.markRewardAwarded).not.toHaveBeenCalled();
    expect(deps.awardXP).not.toHaveBeenCalled();
    expect(deps.recordDailyActivity).not.toHaveBeenCalled();
  });
});

describe('createLearningEngine → uncompleteLesson', () => {
  it('toggles off a lesson that was previously done', () => {
    const deps = buildDeps({ completedSet: new Set(['a|b|c']) });
    const engine = createLearningEngine(deps);

    engine.uncompleteLesson('a|b|c');

    expect(deps.toggleLesson).toHaveBeenCalledTimes(1);
    expect(deps.toggleLesson).toHaveBeenCalledWith('a|b|c', {});
  });

  it('is a no-op when the lesson was never done', () => {
    const deps = buildDeps();
    const engine = createLearningEngine(deps);

    engine.uncompleteLesson('a|b|c');

    expect(deps.toggleLesson).not.toHaveBeenCalled();
  });
});

describe('createLearningEngine → toggleLessonDone', () => {
  it('routes to completeLesson when not yet done', () => {
    const deps = buildDeps();
    const engine = createLearningEngine(deps);

    engine.toggleLessonDone('x|y|z');

    expect(deps.toggleLesson).toHaveBeenCalled();
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed');
  });

  it('routes to uncompleteLesson when already done (no XP awarded again)', () => {
    const deps = buildDeps({ completedSet: new Set(['x|y|z']) });
    const engine = createLearningEngine(deps);

    engine.toggleLessonDone('x|y|z');

    expect(deps.toggleLesson).toHaveBeenCalled();
    expect(deps.awardXP).not.toHaveBeenCalled();
  });

  it('forwards mutation options to lesson toggles', () => {
    const deps = buildDeps();
    const engine = createLearningEngine(deps);

    engine.toggleLessonDone('x|y|z', { skipRemote: true });

    expect(deps.toggleLesson).toHaveBeenCalledWith('x|y|z', { skipRemote: true });
  });
});

describe('createLearningEngine → submitQuiz', () => {
  let deps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('persists the score, awards quiz XP, and records activity', () => {
    const engine = createLearningEngine(deps);

    const result = engine.submitQuiz('html|quiz|1', 7, 10);

    expect(result).toEqual({ score: 7, total: 10, pct: 70 });
    expect(deps.saveQuizScore).toHaveBeenCalledWith('html|quiz|1', '7/10');
    expect(deps.awardXP).toHaveBeenCalledWith(40, 'Quiz completed'); // XP_VALUES.quiz
    expect(deps.recordDailyActivity).toHaveBeenCalledTimes(1);
  });

  it('does not award base quiz XP again when the quiz completion reward already exists', () => {
    const completionKey = rewardKeys.quizComplete('html|quiz|1');
    deps.hasRewardBeenAwarded = vi.fn((rewardKey) => rewardKey === completionKey);
    const engine = createLearningEngine(deps);

    engine.submitQuiz('html|quiz|1', 7, 10);

    expect(deps.saveQuizScore).toHaveBeenCalledWith('html|quiz|1', '7/10');
    expect(deps.markRewardAwarded).not.toHaveBeenCalledWith(completionKey);
    expect(deps.awardXP).not.toHaveBeenCalledWith(40, 'Quiz completed');
    expect(deps.recordDailyActivity).toHaveBeenCalledTimes(1);
  });

  it('awards the perfect quiz bonus only when that reward key has not been earned', () => {
    const earned = new Set([rewardKeys.quizComplete('html|quiz|1')]);
    deps.hasRewardBeenAwarded = vi.fn((rewardKey) => earned.has(rewardKey));
    deps.markRewardAwarded = vi.fn((rewardKey) => {
      if (earned.has(rewardKey)) return false;
      earned.add(rewardKey);
      return true;
    });
    const engine = createLearningEngine(deps);

    engine.submitQuiz('html|quiz|1', 10, 10);
    engine.submitQuiz('html|quiz|1', 10, 10);

    expect(deps.awardXP).toHaveBeenCalledTimes(1);
    expect(deps.awardXP).toHaveBeenCalledWith(60, 'Perfect quiz score!');
  });

  it('preserves an existing better quiz score on a lower-scoring retry', () => {
    const localDeps = buildDeps({
      quizScores: { q: '8/10' },
    });
    const engine = createLearningEngine(localDeps);

    const result = engine.submitQuiz('q', 6, 10);

    expect(result.pct).toBe(60);
    expect(localDeps.saveQuizScore).not.toHaveBeenCalled();
  });

  it('rounds percent to the nearest whole number', () => {
    const engine = createLearningEngine(deps);

    expect(engine.submitQuiz('q', 1, 3).pct).toBe(33);
    expect(engine.submitQuiz('q', 2, 3).pct).toBe(67);
    expect(engine.submitQuiz('q', 10, 10).pct).toBe(100);
    expect(engine.submitQuiz('q', 0, 10).pct).toBe(0);
  });
});

describe('createLearningEngine → completeChallenge', () => {
  it('awards challenge XP, records activity, and returns the completed shape', () => {
    const deps = buildDeps();
    const engine = createLearningEngine(deps);

    const result = engine.completeChallenge('challenge-42');

    expect(result).toEqual({ challengeId: 'challenge-42', completed: true, alreadyCompleted: false });
    expect(deps.markChallengeCompleted).toHaveBeenCalledWith('challenge-42');
    expect(deps.markRewardAwarded).toHaveBeenCalledWith(
      rewardKeys.challengeComplete('challenge-42'),
    );
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Challenge completed');
    expect(deps.recordDailyActivity).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate challenge completion, XP, or activity', () => {
    const deps = buildDeps({
      isChallengeCompleted: vi.fn(() => true),
    });
    const engine = createLearningEngine(deps);

    const result = engine.completeChallenge('challenge-42');

    expect(result).toEqual({ challengeId: 'challenge-42', completed: true, alreadyCompleted: true });
    expect(deps.markChallengeCompleted).not.toHaveBeenCalled();
    expect(deps.markRewardAwarded).not.toHaveBeenCalled();
    expect(deps.awardXP).not.toHaveBeenCalled();
    expect(deps.recordDailyActivity).not.toHaveBeenCalled();
  });
});
