// ═══════════════════════════════════════════════
// badgeRules — pure logic for badge eligibility.
//
// Extracted from ProgressContext so the rules are
// testable in isolation. ProgressContext just builds
// a context snapshot from its state, asks this module
// "what's earned?", and persists/celebrates anything
// new.
//
// Adding a new badge = add a definition to BADGE_DEFS,
// add a check in evaluateBadgeChecks, and (if it needs
// new context) widen the BadgeContext shape.
// ═══════════════════════════════════════════════

import { DAILY_GOAL, getLevel } from '../utils/helpers';

export const BADGE_DEFS = [
  { id: 'first_lesson', icon: '🌱', name: 'First Steps', desc: 'Complete your first lesson' },
  { id: 'five_lessons', icon: '📚', name: 'Getting Started', desc: 'Complete 5 lessons' },
  { id: 'ten_lessons', icon: '🔥', name: 'On Fire', desc: 'Complete 10 lessons' },
  { id: 'twenty_lessons', icon: '💪', name: 'Unstoppable', desc: 'Complete 20 lessons' },
  { id: 'fifty_lessons', icon: '👑', name: 'Legend', desc: 'Complete 50 lessons' },
  { id: 'first_quiz', icon: '🧠', name: 'Quiz Taker', desc: 'Complete your first quiz' },
  { id: 'five_quizzes', icon: '🎓', name: 'Scholar', desc: 'Complete 5 quizzes' },
  { id: 'perfect_quiz', icon: '💯', name: 'Perfectionist', desc: 'Get 100% on any quiz' },
  { id: 'streak_3', icon: '📅', name: 'Hat Trick', desc: '3-day learning streak' },
  { id: 'streak_7', icon: '⚡', name: 'Weekly Warrior', desc: '7-day learning streak' },
  { id: 'level_5', icon: '⭐', name: 'Rising Star', desc: 'Reach Level 5' },
  { id: 'level_10', icon: '🌟', name: 'Superstar', desc: 'Reach Level 10' },
  { id: 'night_owl', icon: '🦉', name: 'Night Owl', desc: 'Study after 10 PM' },
  { id: 'early_bird', icon: '🐦', name: 'Early Bird', desc: 'Study before 7 AM' },
  { id: 'explorer', icon: '🗺️', name: 'Explorer', desc: 'Visit all 4 course tracks' },
  { id: 'daily_goal', icon: '🎯', name: 'Goal Crusher', desc: 'Complete your daily goal' },
  { id: 'bookworm', icon: '📖', name: 'Bookworm', desc: 'Bookmark 10 lessons' },
  { id: 'note_taker', icon: '✏️', name: 'Note Taker', desc: 'Write 5 notes' },
];

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
