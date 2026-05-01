// ═══════════════════════════════════════════════
// badgeRules — pure logic for badge eligibility.
//
// ProgressContext builds a context snapshot from its
// state, asks this module "what's earned?", and
// persists/celebrates anything new.
//
// Adding a new badge = add a definition to BADGE_DEFS
// in src/data/badges.js, add a check in
// evaluateBadgeChecks below, and (if it needs new
// context) widen the snapshot shape used by
// findNewlyEarnedBadges callers.
//
// BADGE_DEFS lives in src/data/badges.js (the canonical
// home alongside the rest of the catalog data); we
// re-export it here so callers reading the rules can
// see both the definitions and the evaluator together.
// ═══════════════════════════════════════════════

import { DAILY_GOAL, getLevel } from '../utils/helpers';
import { BADGE_DEFS } from '../data/badges';

export { BADGE_DEFS };

// Pure: given a snapshot of learner state, return the bool map of
// whether each badge's criteria are currently met.
//
// Context shape (all numbers/booleans, no React state references):
//   {
//     completedCount, quizCount, hasPerfect, xpTotal, streak,
//     coursesVisitedCount, dailyCount, hour,
//     bookmarkCount, noteCount,
//   }
//
// Caller is responsible for filtering against already-earned badges
// (see findNewlyEarnedBadges).
export function evaluateBadgeChecks(ctx) {
  return {
    first_lesson:    ctx.completedCount >= 1,
    five_lessons:    ctx.completedCount >= 5,
    ten_lessons:     ctx.completedCount >= 10,
    twenty_lessons:  ctx.completedCount >= 20,
    fifty_lessons:   ctx.completedCount >= 50,
    first_quiz:      ctx.quizCount >= 1,
    five_quizzes:    ctx.quizCount >= 5,
    perfect_quiz:    Boolean(ctx.hasPerfect),
    streak_3:        ctx.streak >= 3,
    streak_7:        ctx.streak >= 7,
    level_5:         getLevel(ctx.xpTotal) >= 5,
    level_10:        getLevel(ctx.xpTotal) >= 10,
    night_owl:       ctx.hour >= 22,
    early_bird:      ctx.hour < 7,
    explorer:        ctx.coursesVisitedCount >= 4,
    daily_goal:      ctx.dailyCount >= DAILY_GOAL,
    bookworm:        ctx.bookmarkCount >= 10,
    note_taker:      ctx.noteCount >= 5,
  };
}

// Returns the BADGE_DEFS entries that the learner has just earned —
// criteria are met now AND the badge is not in alreadyEarned.
//
// alreadyEarned can be a Set of ids, a Map keyed by id, or a plain
// object keyed by id (e.g. { first_lesson: { date: '2026-04-30' } }).
// We treat any truthy value as "earned" for the dedupe check, so the
// existing earnedBadges shape works as-is.
export function findNewlyEarnedBadges(ctx, alreadyEarned) {
  const checks = evaluateBadgeChecks(ctx);
  const isEarned = makeIsEarnedFn(alreadyEarned);
  const newly = [];

  for (const badge of BADGE_DEFS) {
    if (checks[badge.id] && !isEarned(badge.id)) {
      newly.push(badge);
    }
  }

  return newly;
}

function makeIsEarnedFn(alreadyEarned) {
  if (alreadyEarned instanceof Set) return (id) => alreadyEarned.has(id);
  if (alreadyEarned instanceof Map) return (id) => alreadyEarned.has(id);
  if (alreadyEarned && typeof alreadyEarned === 'object') {
    return (id) => Boolean(alreadyEarned[id]);
  }
  return () => false;
}
