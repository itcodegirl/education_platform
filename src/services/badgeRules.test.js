import { describe, it, expect } from 'vitest';
import {
  BADGE_DEFS,
  evaluateBadgeChecks,
  findNewlyEarnedBadges,
} from './badgeRules';

const ZERO_CTX = {
  completedCount: 0,
  quizCount: 0,
  hasPerfect: false,
  xpTotal: 0,
  streak: 0,
  coursesVisitedCount: 0,
  dailyCount: 0,
  hour: 12,
  bookmarkCount: 0,
  noteCount: 0,
};

describe('BADGE_DEFS', () => {
  it('has unique ids and a definition for every key referenced in evaluateBadgeChecks', () => {
    const ids = BADGE_DEFS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Every key returned by evaluateBadgeChecks must correspond to a
    // real badge definition; otherwise we'd silently never award it.
    const checkKeys = Object.keys(evaluateBadgeChecks(ZERO_CTX));
    for (const id of ids) expect(checkKeys).toContain(id);
    for (const key of checkKeys) expect(ids).toContain(key);
  });
});

describe('evaluateBadgeChecks', () => {
  it('returns all-false for a zero learner', () => {
    const checks = evaluateBadgeChecks(ZERO_CTX);
    for (const id of Object.keys(checks)) {
      expect(checks[id]).toBe(false);
    }
  });

  it('flips lesson-count badges at their exact thresholds', () => {
    expect(evaluateBadgeChecks({ ...ZERO_CTX, completedCount: 1 }).first_lesson).toBe(true);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, completedCount: 4 }).five_lessons).toBe(false);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, completedCount: 5 }).five_lessons).toBe(true);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, completedCount: 50 }).fifty_lessons).toBe(true);
  });

  it('handles streak thresholds independently', () => {
    expect(evaluateBadgeChecks({ ...ZERO_CTX, streak: 3 }).streak_3).toBe(true);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, streak: 3 }).streak_7).toBe(false);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, streak: 7 }).streak_7).toBe(true);
  });

  it('time-of-day badges use the hour field', () => {
    expect(evaluateBadgeChecks({ ...ZERO_CTX, hour: 6 }).early_bird).toBe(true);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, hour: 7 }).early_bird).toBe(false);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, hour: 21 }).night_owl).toBe(false);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, hour: 22 }).night_owl).toBe(true);
  });

  it('coerces hasPerfect truthiness for the perfect_quiz badge', () => {
    expect(evaluateBadgeChecks({ ...ZERO_CTX, hasPerfect: true }).perfect_quiz).toBe(true);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, hasPerfect: 'truthy-string' }).perfect_quiz).toBe(true);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, hasPerfect: 0 }).perfect_quiz).toBe(false);
  });

  it('explorer badge unlocks once all four course tracks have been visited', () => {
    expect(evaluateBadgeChecks({ ...ZERO_CTX, coursesVisitedCount: 3 }).explorer).toBe(false);
    expect(evaluateBadgeChecks({ ...ZERO_CTX, coursesVisitedCount: 4 }).explorer).toBe(true);
  });
});

describe('findNewlyEarnedBadges', () => {
  it('returns nothing for a zero learner', () => {
    expect(findNewlyEarnedBadges(ZERO_CTX, {})).toEqual([]);
  });

  it('returns every freshly earned badge in BADGE_DEFS order', () => {
    const ctx = {
      ...ZERO_CTX,
      completedCount: 5,
      quizCount: 1,
      hasPerfect: true,
    };
    const newly = findNewlyEarnedBadges(ctx, {});
    const ids = newly.map((b) => b.id);
    expect(ids).toEqual(['first_lesson', 'five_lessons', 'first_quiz', 'perfect_quiz']);
  });

  it('skips badges already present in the alreadyEarned object', () => {
    const ctx = { ...ZERO_CTX, completedCount: 5 };
    const alreadyEarned = { first_lesson: { date: '2026-04-30' } };
    const newly = findNewlyEarnedBadges(ctx, alreadyEarned);
    expect(newly.map((b) => b.id)).toEqual(['five_lessons']);
  });

  it('treats any truthy alreadyEarned[id] as earned (matches the storage shape)', () => {
    const ctx = { ...ZERO_CTX, completedCount: 1 };
    expect(findNewlyEarnedBadges(ctx, { first_lesson: true })).toEqual([]);
    expect(findNewlyEarnedBadges(ctx, { first_lesson: 1 })).toEqual([]);
    expect(findNewlyEarnedBadges(ctx, { first_lesson: { date: 'x' } })).toEqual([]);
    expect(findNewlyEarnedBadges(ctx, { first_lesson: false })[0]?.id).toBe('first_lesson');
    expect(findNewlyEarnedBadges(ctx, { first_lesson: null })[0]?.id).toBe('first_lesson');
  });

  it('accepts a Set of earned ids', () => {
    const ctx = { ...ZERO_CTX, completedCount: 1 };
    expect(findNewlyEarnedBadges(ctx, new Set(['first_lesson']))).toEqual([]);
    expect(findNewlyEarnedBadges(ctx, new Set())[0]?.id).toBe('first_lesson');
  });

  it('accepts a Map keyed by id', () => {
    const ctx = { ...ZERO_CTX, completedCount: 1 };
    expect(findNewlyEarnedBadges(ctx, new Map([['first_lesson', { date: 'x' }]]))).toEqual([]);
  });

  it('treats a missing/nullish alreadyEarned arg as no badges earned yet', () => {
    const ctx = { ...ZERO_CTX, completedCount: 1 };
    expect(findNewlyEarnedBadges(ctx, null)[0]?.id).toBe('first_lesson');
    expect(findNewlyEarnedBadges(ctx, undefined)[0]?.id).toBe('first_lesson');
  });
});
