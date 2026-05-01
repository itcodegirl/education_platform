// ═══════════════════════════════════════════════
// GAMIFICATION SERVICE — Badge checks + XP math
// Pure logic, no state. Context calls these.
// ═══════════════════════════════════════════════

import { BADGE_DEFS } from '../data/badges';

function getEarnedBadgeIds(alreadyEarned) {
  if (Array.isArray(alreadyEarned)) return new Set(alreadyEarned);
  if (alreadyEarned && typeof alreadyEarned === 'object') {
    return new Set(Object.keys(alreadyEarned));
  }
  return new Set();
}

// ─── Badge eligibility check ────────────────
export function checkBadgeEligibility(
  ctx,
) {
  const xpTotal = Number(ctx.xpTotal ?? ctx.xp ?? 0);
  const quizCount = Number(ctx.quizCount ?? 0);
  const completedCount = Number(ctx.completedCount ?? 0);
  const streak = Number(ctx.streak ?? 0);
  const coursesVisitedCount = Number(ctx.coursesVisitedCount ?? ctx.coursesVisited ?? 0);
  const dailyCount = Number(ctx.dailyCount ?? 0);
  const dailyGoal = Number(ctx.dailyGoal ?? 5);
  const hour = Number(ctx.hour ?? new Date().getHours());

  return {
    first_lesson: completedCount >= 1,
    five_lessons: completedCount >= 5,
    ten_lessons: completedCount >= 10,
    twenty_lessons: completedCount >= 20,
    fifty_lessons: completedCount >= 50,
    first_quiz: quizCount >= 1,
    five_quizzes: quizCount >= 5,
    perfect_quiz: Boolean(ctx.hasPerfect),
    streak_3: streak >= 3,
    streak_7: streak >= 7,
    level_5: getLevel(xpTotal) >= 5,
    level_10: getLevel(xpTotal) >= 10,
    night_owl: hour >= 22,
    early_bird: hour < 7,
    explorer: coursesVisitedCount >= 4,
    daily_goal: dailyGoal > 0 && dailyCount >= dailyGoal,
    bookworm: Number(ctx.bookmarkCount ?? 0) >= 10,
    note_taker: Number(ctx.noteCount ?? 0) >= 5,
  };
}

// ─── Find newly earned badges ───────────────
export function getNewBadges(
  eligibility,
  alreadyEarned,
) {
  const newBadges = [];
  const earnedBadgeIds = getEarnedBadgeIds(alreadyEarned);

  for (const [id, eligible] of Object.entries(eligibility)) {
    if (eligible && !earnedBadgeIds.has(id)) {
      const def = BADGE_DEFS.find((b) => b.id === id);
      if (def) newBadges.push(def);
    }
  }
  return newBadges;
}

// ─── XP level calculations ─────────────────
export const XP_PER_LEVEL = 150;

/**
 * Convert total XP into the user's 1-based level.
 */
export function getLevel(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/**
 * Return XP progress within the current level bucket.
 */
export function getXPInLevel(xp) {
  return xp % XP_PER_LEVEL;
}

/**
 * Return current level completion as an integer percentage.
 */
export function getXPProgress(xp) {
  return Math.round((getXPInLevel(xp) / XP_PER_LEVEL) * 100);
}
