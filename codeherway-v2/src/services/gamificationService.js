// ═══════════════════════════════════════════════
// GAMIFICATION SERVICE — Badge checks + XP math
// Pure logic, no state. Context calls these.
// ═══════════════════════════════════════════════

import { BADGE_DEFS } from '../context/ProgressContext';

// ─── Badge eligibility check ────────────────
export function checkBadgeEligibility(ctx) {
  return {
    first_lesson: ctx.completedCount >= 1,
    five_lessons: ctx.completedCount >= 5,
    ten_lessons: ctx.completedCount >= 10,
    twenty_lessons: ctx.completedCount >= 20,
    fifty_lessons: ctx.completedCount >= 50,
    quiz_whiz: ctx.quizCount >= 5,
    quiz_master: ctx.quizCount >= 20,
    streak_3: ctx.streak >= 3,
    streak_7: ctx.streak >= 7,
    streak_30: ctx.streak >= 30,
    xp_100: ctx.xp >= 100,
    xp_500: ctx.xp >= 500,
    xp_1000: ctx.xp >= 1000,
    explorer: ctx.coursesVisited >= 3,
    bookworm: ctx.bookmarkCount >= 10,
    daily_grind: ctx.dailyCount >= 5,
    sr_scholar: ctx.srCount >= 10,
    note_taker: ctx.noteCount >= 5,
  };
}

// ─── Find newly earned badges ───────────────
export function getNewBadges(eligibility, alreadyEarned) {
  const newBadges = [];
  for (const [id, eligible] of Object.entries(eligibility)) {
    if (eligible && !alreadyEarned.includes(id)) {
      const def = BADGE_DEFS.find(b => b.id === id);
      if (def) newBadges.push(def);
    }
  }
  return newBadges;
}

// ─── XP level calculations ─────────────────
export const XP_PER_LEVEL = 150;

export function getLevel(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getXPInLevel(xp) {
  return xp % XP_PER_LEVEL;
}

export function getXPProgress(xp) {
  return Math.round((getXPInLevel(xp) / XP_PER_LEVEL) * 100);
}
