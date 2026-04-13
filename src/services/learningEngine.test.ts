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
import type { LearningEngineDeps } from './supabaseTypes';

function buildDeps(overrides: Partial<LearningEngineDeps> = {}): LearningEngineDeps & {
  toggleLesson: ReturnType<typeof vi.fn>;
  saveQuizScore: ReturnType<typeof vi.fn>;
  awardXP: ReturnType<typeof vi.fn>;
  recordDailyActivity: ReturnType<typeof vi.fn>;
} {
  return {
    toggleLesson: vi.fn(),
    saveQuizScore: vi.fn(),
    awardXP: vi.fn(),
    recordDailyActivity: vi.fn(),
    completedSet: new Set<string>(),
    ...overrides,
  } as any;
}

describe('createLearningEngine → completeLesson', () => {
  it('marks a new lesson done, awards XP, and records daily activity', () => {
    const deps = buildDeps();
    const engine = createLearningEngine(deps);

    engine.completeLesson('html|intro|first');

    expect(deps.toggleLesson).toHaveBeenCalledTimes(1);
    expect(deps.toggleLesson).toHaveBeenCalledWith('html|intro|first');
    expect(deps.awardXP).toHaveBeenCalledTimes(1);
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Lesson completed'); // XP_VALUES.lesson
    expect(deps.recordDailyActivity).toHaveBeenCalledTimes(1);
  });

  it('toggles a completed lesson OFF without awarding XP again', () => {
    const deps = buildDeps({
      completedSet: new Set<string>(['html|intro|first']),
    });
    const engine = createLearningEngine(deps);

    engine.completeLesson('html|intro|first');

    expect(deps.toggleLesson).toHaveBeenCalledTimes(1);
    expect(deps.awardXP).not.toHaveBeenCalled();
    expect(deps.recordDailyActivity).not.toHaveBeenCalled();
  });
});

describe('createLearningEngine → uncompleteLesson', () => {
  it('toggles off a lesson that was previously done', () => {
    const deps = buildDeps({ completedSet: new Set<string>(['a|b|c']) });
    const engine = createLearningEngine(deps);

    engine.uncompleteLesson('a|b|c');

    expect(deps.toggleLesson).toHaveBeenCalledTimes(1);
    expect(deps.toggleLesson).toHaveBeenCalledWith('a|b|c');
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
    const deps = buildDeps({ completedSet: new Set<string>(['x|y|z']) });
    const engine = createLearningEngine(deps);

    engine.toggleLessonDone('x|y|z');

    expect(deps.toggleLesson).toHaveBeenCalled();
    expect(deps.awardXP).not.toHaveBeenCalled();
  });
});

describe('createLearningEngine → submitQuiz', () => {
  let deps: ReturnType<typeof buildDeps>;

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

    expect(result).toEqual({ challengeId: 'challenge-42', completed: true });
    expect(deps.awardXP).toHaveBeenCalledWith(25, 'Challenge completed');
    expect(deps.recordDailyActivity).toHaveBeenCalledTimes(1);
  });
});
