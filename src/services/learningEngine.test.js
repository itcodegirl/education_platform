// ═══════════════════════════════════════════════
// Unit tests for the learning engine factory.
//
// createLearningEngine takes a dependency bag and
// returns a small orchestrator. We pass in Vitest
// mocks and assert that the right dependencies fire
// on each action — no real Supabase, no real React.
// ═══════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { readRewardLedger } from '../engine/rewards/rewardLedger';
import { createLearningEngine } from './learningEngine';
import { rewardKeys } from './rewardPolicy';

function createMemoryStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem: (key) => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => entries.set(key, String(value)),
  };
}

function createDeferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function buildDeps(overrides = {}) {
  // Default each test to its own in-memory storage so the reward
  // ledger / queue can never leak between cases via globalThis
  // localStorage. Tests that want to assert ledger contents pass
  // an explicit storage in their override.
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
    markSyncFailed: vi.fn(),
    rewardEventStorage: createMemoryStorage(),
    ...overrides,
  };
}

beforeEach(() => {
  // Defense in depth: even with isolated rewardEventStorage in
  // buildDeps, anything that defaults to globalThis.localStorage
  // (legacy code paths, helpers we add later) starts clean.
  if (typeof localStorage !== 'undefined' && localStorage?.clear) {
    localStorage.clear();
  }
});

describe('createLearningEngine → completeLesson', () => {
  it('marks a new lesson done, awards XP, and records daily activity', async () => {
    const deps = buildDeps();
    const engine = createLearningEngine(deps);

    await engine.completeLesson('html|intro|first');

    expect(deps.toggleLesson).toHaveBeenCalledTimes(1);
    expect(deps.toggleLesson).toHaveBeenCalledWith('html|intro|first', {});
    await waitFor(() => {
      expect(deps.markRewardAwarded).toHaveBeenCalledWith(
        rewardKeys.lessonComplete('html|intro|first'),
      );
      expect(deps.awardXP).toHaveBeenCalledTimes(1);
      expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed'); // XP_VALUES.lesson
      expect(deps.recordDailyActivity).toHaveBeenCalledTimes(1);
    });
  });

  it('toggles a completed lesson OFF without awarding XP again', async () => {
    const deps = buildDeps({
      completedSet: new Set(['html|intro|first']),
    });
    const engine = createLearningEngine(deps);

    await engine.completeLesson('html|intro|first');

    expect(deps.toggleLesson).toHaveBeenCalledTimes(1);
    expect(deps.awardXP).not.toHaveBeenCalled();
    expect(deps.recordDailyActivity).not.toHaveBeenCalled();
  });

  it('does not award XP again when a previously rewarded lesson is recompleted', async () => {
    const deps = buildDeps({
      completedSet: new Set(),
      hasRewardBeenAwarded: vi.fn(() => true),
    });
    const engine = createLearningEngine(deps);

    await engine.completeLesson('html|intro|first');

    expect(deps.toggleLesson).toHaveBeenCalledTimes(1);
    expect(deps.toggleLesson).toHaveBeenCalledWith('html|intro|first', {});
    await waitFor(() => {
      expect(deps.hasRewardBeenAwarded).toHaveBeenCalledWith(
        rewardKeys.lessonComplete('html|intro|first'),
      );
    });
    expect(deps.markRewardAwarded).not.toHaveBeenCalled();
    expect(deps.awardXP).not.toHaveBeenCalled();
    expect(deps.recordDailyActivity).not.toHaveBeenCalled();
  });

  it('records a learner-scoped reward event when completing a new lesson', async () => {
    const rewardEventStorage = createMemoryStorage();
    const deps = buildDeps({
      learnerKey: 'learner-123',
      rewardEventStorage,
    });
    const engine = createLearningEngine(deps);

    await engine.completeLesson('html|intro|first');

    let result;
    await waitFor(() => {
      result = readRewardLedger('learner-123', { storage: rewardEventStorage });
      expect(result.ledger.processedKeys).toEqual([
        'lesson-complete:html|intro|first:learner-123',
      ]);
    });
    expect(result.ledger.processedKeys).toEqual([
      'lesson-complete:html|intro|first:learner-123',
    ]);
    expect(result.ledger.events[0]).toMatchObject({
      key: 'lesson-complete:html|intro|first:learner-123',
      type: 'LESSON_COMPLETE',
      targetId: 'html|intro|first',
      learnerKey: 'learner-123',
      metadata: {
        rewardKey: rewardKeys.lessonComplete('html|intro|first'),
      },
    });
  });

  it('does not wait for backend reward processing before returning to the caller', async () => {
    const backendAttempt = createDeferred();
    const deps = buildDeps({
      learnerKey: 'learner-123',
      backendRewardSyncEnabled: true,
      backendRewardAward: vi.fn(() => backendAttempt.promise),
    });
    const engine = createLearningEngine(deps);
    const navigation = vi.fn();

    await engine.toggleLessonDone('html|intro|first');
    navigation();

    expect(deps.toggleLesson).toHaveBeenCalledWith('html|intro|first', {});
    expect(navigation).toHaveBeenCalledTimes(1);
    expect(deps.awardXP).not.toHaveBeenCalled();

    backendAttempt.resolve({ status: 'awarded', xpAwarded: 25, totalXp: 25 });
    await waitFor(() => {
      expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed', { skipRemote: true });
    });
  });

  it('keeps the caller unblocked when background lesson reward processing fails', async () => {
    const deps = buildDeps({
      learnerKey: 'learner-123',
      backendRewardSyncEnabled: true,
      backendRewardAward: vi.fn(async () => ({
        status: 'failed',
        reason: 'backend unavailable',
        errorMessage: 'backend unavailable',
      })),
    });
    const engine = createLearningEngine(deps);
    const navigation = vi.fn();

    await engine.toggleLessonDone('html|intro|first');
    navigation();

    expect(deps.toggleLesson).toHaveBeenCalledWith('html|intro|first', {});
    expect(navigation).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(deps.markSyncFailed).toHaveBeenCalledWith(
        'backend reward failed:lesson-complete:html|intro|first:learner-123',
      );
    });
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
  it('routes to completeLesson when not yet done', async () => {
    const deps = buildDeps();
    const engine = createLearningEngine(deps);

    await engine.toggleLessonDone('x|y|z');

    expect(deps.toggleLesson).toHaveBeenCalled();
    await waitFor(() => {
      expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed');
    });
  });

  it('routes to uncompleteLesson when already done (no XP awarded again)', () => {
    const deps = buildDeps({ completedSet: new Set(['x|y|z']) });
    const engine = createLearningEngine(deps);

    engine.toggleLessonDone('x|y|z');

    expect(deps.toggleLesson).toHaveBeenCalled();
    expect(deps.awardXP).not.toHaveBeenCalled();
  });

  it('forwards mutation options to lesson toggles', async () => {
    const deps = buildDeps();
    const engine = createLearningEngine(deps);

    await engine.toggleLessonDone('x|y|z', { skipRemote: true });

    expect(deps.toggleLesson).toHaveBeenCalledWith('x|y|z', { skipRemote: true });
  });
});

describe('createLearningEngine → submitQuiz', () => {
  let deps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('persists the score, awards quiz XP, and records activity', async () => {
    const engine = createLearningEngine(deps);

    const result = await engine.submitQuiz('html|quiz|1', 7, 10);

    expect(result).toEqual({ score: 7, total: 10, pct: 70 });
    expect(deps.saveQuizScore).toHaveBeenCalledWith('html|quiz|1', '7/10');
    expect(deps.awardXP).toHaveBeenCalledWith(40, 'Quiz completed'); // XP_VALUES.quiz
    expect(deps.recordDailyActivity).toHaveBeenCalledTimes(1);
  });

  it('does not award base quiz XP again when the quiz completion reward already exists', async () => {
    const completionKey = rewardKeys.quizComplete('html|quiz|1');
    deps.hasRewardBeenAwarded = vi.fn((rewardKey) => rewardKey === completionKey);
    const engine = createLearningEngine(deps);

    await engine.submitQuiz('html|quiz|1', 7, 10);

    expect(deps.saveQuizScore).toHaveBeenCalledWith('html|quiz|1', '7/10');
    expect(deps.markRewardAwarded).not.toHaveBeenCalledWith(completionKey);
    expect(deps.awardXP).not.toHaveBeenCalledWith(40, 'Quiz completed');
    expect(deps.recordDailyActivity).toHaveBeenCalledTimes(1);
  });

  it('awards the perfect quiz bonus only when that reward key has not been earned', async () => {
    const earned = new Set([rewardKeys.quizComplete('html|quiz|1')]);
    deps.hasRewardBeenAwarded = vi.fn((rewardKey) => earned.has(rewardKey));
    deps.markRewardAwarded = vi.fn((rewardKey) => {
      if (earned.has(rewardKey)) return false;
      earned.add(rewardKey);
      return true;
    });
    const engine = createLearningEngine(deps);

    await engine.submitQuiz('html|quiz|1', 10, 10);
    await engine.submitQuiz('html|quiz|1', 10, 10);

    expect(deps.awardXP).toHaveBeenCalledTimes(1);
    expect(deps.awardXP).toHaveBeenCalledWith(60, 'Perfect quiz score!');
  });

  it('records learner-scoped reward events for quiz base and perfect rewards', async () => {
    const rewardEventStorage = createMemoryStorage();
    deps.learnerKey = 'learner-123';
    deps.rewardEventStorage = rewardEventStorage;
    const engine = createLearningEngine(deps);

    await engine.submitQuiz('html|quiz|1', 10, 10);

    const result = readRewardLedger('learner-123', { storage: rewardEventStorage });
    expect(result.ledger.processedKeys).toEqual([
      'quiz-base:html|quiz|1:learner-123',
      'quiz-perfect:html|quiz|1:learner-123',
    ]);
    expect(result.ledger.events).toEqual([
      expect.objectContaining({
        type: 'QUIZ_BASE',
        targetId: 'html|quiz|1',
        metadata: expect.objectContaining({
          rewardKey: rewardKeys.quizComplete('html|quiz|1'),
          pct: 100,
        }),
      }),
      expect.objectContaining({
        type: 'QUIZ_PERFECT',
        targetId: 'html|quiz|1',
        metadata: expect.objectContaining({
          rewardKey: rewardKeys.quizPerfect('html|quiz|1'),
          pct: 100,
        }),
      }),
    ]);
  });

  it('preserves an existing better quiz score on a lower-scoring retry', async () => {
    const localDeps = buildDeps({
      quizScores: { q: '8/10' },
    });
    const engine = createLearningEngine(localDeps);

    const result = await engine.submitQuiz('q', 6, 10);

    expect(result.pct).toBe(60);
    expect(localDeps.saveQuizScore).not.toHaveBeenCalled();
  });

  it('rounds percent to the nearest whole number', async () => {
    const engine = createLearningEngine(deps);

    expect((await engine.submitQuiz('q', 1, 3)).pct).toBe(33);
    expect((await engine.submitQuiz('q', 2, 3)).pct).toBe(67);
    expect((await engine.submitQuiz('q', 10, 10)).pct).toBe(100);
    expect((await engine.submitQuiz('q', 0, 10)).pct).toBe(0);
  });
});

describe('createLearningEngine → completeChallenge', () => {
  it('awards challenge XP, records activity, and returns the completed shape', async () => {
    const deps = buildDeps();
    const engine = createLearningEngine(deps);

    const result = await engine.completeChallenge('challenge-42');

    expect(result).toEqual({ challengeId: 'challenge-42', completed: true, alreadyCompleted: false });
    expect(deps.markChallengeCompleted).toHaveBeenCalledWith('challenge-42');
    expect(deps.markRewardAwarded).toHaveBeenCalledWith(
      rewardKeys.challengeComplete('challenge-42'),
    );
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Challenge completed');
    expect(deps.recordDailyActivity).toHaveBeenCalledTimes(1);
  });

  it('records a learner-scoped reward event when completing a challenge', async () => {
    const rewardEventStorage = createMemoryStorage();
    const deps = buildDeps({
      learnerKey: 'learner-123',
      rewardEventStorage,
    });
    const engine = createLearningEngine(deps);

    const result = await engine.completeChallenge('challenge-42');

    expect(result).toEqual({ challengeId: 'challenge-42', completed: true, alreadyCompleted: false });
    const ledgerResult = readRewardLedger('learner-123', { storage: rewardEventStorage });
    expect(ledgerResult.ledger.processedKeys).toEqual([
      'challenge-complete:challenge-42:learner-123',
    ]);
    expect(ledgerResult.ledger.events[0]).toMatchObject({
      type: 'CHALLENGE_COMPLETE',
      targetId: 'challenge-42',
      learnerKey: 'learner-123',
      metadata: {
        rewardKey: rewardKeys.challengeComplete('challenge-42'),
      },
    });
  });

  it('does not duplicate challenge completion, XP, or activity', async () => {
    const deps = buildDeps({
      isChallengeCompleted: vi.fn(() => true),
    });
    const engine = createLearningEngine(deps);

    const result = await engine.completeChallenge('challenge-42');

    expect(result).toEqual({ challengeId: 'challenge-42', completed: true, alreadyCompleted: true });
    expect(deps.markChallengeCompleted).not.toHaveBeenCalled();
    expect(deps.markRewardAwarded).not.toHaveBeenCalled();
    expect(deps.awardXP).not.toHaveBeenCalled();
    expect(deps.recordDailyActivity).not.toHaveBeenCalled();
  });
});
