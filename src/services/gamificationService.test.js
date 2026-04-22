// ═══════════════════════════════════════════════
// Unit tests for the gamification service.
//
// checkBadgeEligibility, getLevel, getXPInLevel, and
// getXPProgress are pure functions — no side effects,
// no I/O, no React — so they're trivial to test in
// pure Node.
//
// getNewBadges depends on BADGE_DEFS from ProgressContext
// (a React module), so we stub that import with a mock
// so the test file never pulls in React.
// ═══════════════════════════════════════════════

import { describe, it, expect, vi } from 'vitest';

// Stub BADGE_DEFS so importing gamificationService doesn't pull in
// React via src/context/ProgressContext.jsx.
vi.mock('../context/ProgressContext', () => ({
  BADGE_DEFS: [
    { id: 'first_lesson', name: 'First Lesson', emoji: '🌱' },
    { id: 'five_lessons', name: 'Five Lessons', emoji: '🌿' },
    { id: 'streak_7', name: 'Week Warrior', emoji: '🔥' },
    { id: 'xp_100', name: 'XP 100', emoji: '💯' },
  ],
}));

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
  xp: 0,
  coursesVisited: 0,
  bookmarkCount: 0,
  dailyCount: 0,
  srCount: 0,
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

  it('unlocks streak badges at 3, 7, and 30 days', () => {
    expect(checkBadgeEligibility({ ...emptyCtx, streak: 2 }).streak_3).toBe(false);
    expect(checkBadgeEligibility({ ...emptyCtx, streak: 3 }).streak_3).toBe(true);
    expect(checkBadgeEligibility({ ...emptyCtx, streak: 7 }).streak_7).toBe(true);
    expect(checkBadgeEligibility({ ...emptyCtx, streak: 30 }).streak_30).toBe(true);
  });

  it('unlocks XP badges at 100, 500, and 1000', () => {
    const e = checkBadgeEligibility({ ...emptyCtx, xp: 1000 });
    expect(e.xp_100).toBe(true);
    expect(e.xp_500).toBe(true);
    expect(e.xp_1000).toBe(true);
  });

  it('unlocks the explorer badge after 3 course visits', () => {
    expect(checkBadgeEligibility({ ...emptyCtx, coursesVisited: 2 }).explorer).toBe(
      false,
    );
    expect(checkBadgeEligibility({ ...emptyCtx, coursesVisited: 3 }).explorer).toBe(
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
      xp: 100,
    });
    const alreadyEarned = ['first_lesson'];

    const newOnes = getNewBadges(eligibility, alreadyEarned);
    const ids = newOnes.map((b) => b.id);

    expect(ids).toContain('five_lessons');
    expect(ids).toContain('streak_7');
    expect(ids).toContain('xp_100');
    expect(ids).not.toContain('first_lesson');
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
