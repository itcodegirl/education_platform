// ═══════════════════════════════════════════════
// Unit tests for the gamification service.
//
// checkBadgeEligibility, getLevel, getXPInLevel, and
// getXPProgress are pure functions — no side effects,
// no I/O, no React — so they're trivial to test in
// pure Node.
//
// getNewBadges depends on shared badge metadata. Keep this unit test
// focused on filtering behavior instead of the full badge catalog.
// ═══════════════════════════════════════════════

import { describe, it, expect } from 'vitest';

import {
  checkBadgeEligibility,
  getNewBadges,
  getLevel,
  getXPInLevel,
  getXPProgress,
  XP_PER_LEVEL,
} from './gamificationService';

const emptyCtx = {
  completedCount: 0,
  quizCount: 0,
  streak: 0,
  xpTotal: 0,
  coursesVisitedCount: 0,
  bookmarkCount: 0,
  dailyCount: 0,
  dailyGoal: 5,
  hasPerfect: false,
  hour: 12,
  noteCount: 0,
};

describe('checkBadgeEligibility', () => {
  it('returns all false for an empty context', () => {
    const eligibility = checkBadgeEligibility(emptyCtx);
    expect(Object.values(eligibility).every((v) => v === false)).toBe(true);
  });

  it('unlocks first_lesson at 1 completed lesson', () => {
    const eligibility = checkBadgeEligibility({ ...emptyCtx, completedCount: 1 });
    expect(eligibility.first_lesson).toBe(true);
    expect(eligibility.five_lessons).toBe(false);
  });

  it('unlocks cumulative lesson milestones at the right thresholds', () => {
    const e = checkBadgeEligibility({ ...emptyCtx, completedCount: 50 });
    expect(e.first_lesson).toBe(true);
    expect(e.five_lessons).toBe(true);
    expect(e.ten_lessons).toBe(true);
    expect(e.twenty_lessons).toBe(true);
    expect(e.fifty_lessons).toBe(true);
  });

  it('unlocks streak badges at 3 and 7 days', () => {
    expect(checkBadgeEligibility({ ...emptyCtx, streak: 2 }).streak_3).toBe(false);
    expect(checkBadgeEligibility({ ...emptyCtx, streak: 3 }).streak_3).toBe(true);
    expect(checkBadgeEligibility({ ...emptyCtx, streak: 7 }).streak_7).toBe(true);
  });

  it('unlocks level badges from XP totals', () => {
    const e = checkBadgeEligibility({ ...emptyCtx, xpTotal: XP_PER_LEVEL * 9 });
    expect(e.level_5).toBe(true);
    expect(e.level_10).toBe(true);
  });

  it('unlocks quiz, perfect, daily, and time-based badges from matching signals', () => {
    const e = checkBadgeEligibility({
      ...emptyCtx,
      quizCount: 5,
      hasPerfect: true,
      dailyCount: 5,
      hour: 23,
    });
    expect(e.first_quiz).toBe(true);
    expect(e.five_quizzes).toBe(true);
    expect(e.perfect_quiz).toBe(true);
    expect(e.daily_goal).toBe(true);
    expect(e.night_owl).toBe(true);
    expect(e.early_bird).toBe(false);
  });

  it('unlocks the explorer badge after all four course tracks are visited', () => {
    expect(checkBadgeEligibility({ ...emptyCtx, coursesVisitedCount: 3 }).explorer).toBe(
      false,
    );
    expect(checkBadgeEligibility({ ...emptyCtx, coursesVisitedCount: 4 }).explorer).toBe(
      true,
    );
  });
});

describe('getNewBadges', () => {
  it('returns only newly eligible badges that are not already earned', () => {
    const eligibility = checkBadgeEligibility({
      ...emptyCtx,
      completedCount: 5,
      streak: 7,
      xpTotal: XP_PER_LEVEL * 4,
    });
    const alreadyEarned = ['first_lesson'];

    const newOnes = getNewBadges(eligibility, alreadyEarned);
    const ids = newOnes.map((b) => b.id);

    expect(ids).toContain('five_lessons');
    expect(ids).toContain('streak_7');
    expect(ids).toContain('level_5');
    expect(ids).not.toContain('first_lesson');
  });

  it('accepts an earned-badge map when filtering already earned badges', () => {
    const eligibility = { first_lesson: true, five_lessons: true };
    const newOnes = getNewBadges(eligibility, { first_lesson: { date: 'today' } });
    expect(newOnes.map((badge) => badge.id)).toEqual(['five_lessons']);
  });

  it('returns an empty array when nothing is newly earned', () => {
    expect(getNewBadges({}, [])).toEqual([]);
  });

  it('ignores ids that have no matching BADGE_DEFS entry', () => {
    const unknown = { nonexistent_badge: true };
    expect(getNewBadges(unknown, [])).toEqual([]);
  });
});

describe('XP math', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(getLevel(0)).toBe(1);
    expect(getXPInLevel(0)).toBe(0);
    expect(getXPProgress(0)).toBe(0);
  });

  it('reports half-progress through level 1 at half the XP_PER_LEVEL', () => {
    expect(getXPInLevel(XP_PER_LEVEL / 2)).toBe(XP_PER_LEVEL / 2);
    expect(getXPProgress(XP_PER_LEVEL / 2)).toBe(50);
  });

  it('rolls over to level 2 exactly at XP_PER_LEVEL', () => {
    expect(getLevel(XP_PER_LEVEL)).toBe(2);
    expect(getXPInLevel(XP_PER_LEVEL)).toBe(0);
    expect(getXPProgress(XP_PER_LEVEL)).toBe(0);
  });

  it('stacks levels correctly for large XP values', () => {
    expect(getLevel(XP_PER_LEVEL * 5)).toBe(6);
    expect(getLevel(XP_PER_LEVEL * 10 + 50)).toBe(11);
    expect(getXPInLevel(XP_PER_LEVEL * 10 + 50)).toBe(50);
  });
});
