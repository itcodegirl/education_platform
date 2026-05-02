// ═══════════════════════════════════════════════
// HELPERS — Constants, XP math, date helpers
// ═══════════════════════════════════════════════

// ─── Constants ──────────────────────────────────
export const XP_PER_LEVEL = 150;
export const DAILY_GOAL = 3;

export const XP_VALUES = {
  lesson: 25,
  quiz: 40,
  perfectQuiz: 60,
  challenge: 25,
};

// Timing constants (ms)
export const TIMING = {
  copyFeedback: 2000,
  confettiDuration: 4000,
  courseConfettiDuration: 6000,
  onlineToastDuration: 3000,
  downloadFeedback: 1000,
  dayMs: 86400000,
};

// Milestone thresholds for confetti
export const MILESTONES = [5, 10, 25, 50, 75, 92];

// ─── Functions ──────────────────────────────────
export function getLevel(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getXPInLevel(xp) {
  return xp % XP_PER_LEVEL;
}

export function estimateReadingTime(text) {
  if (!text) return 1;
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export function getYesterdayString() {
  return new Date(Date.now() - TIMING.dayMs).toISOString().slice(0, 10);
}

// Returns the streak count the UI should actually display, given
// the persisted streak length and the date of the last recorded
// activity. The DB stores the raw value from the last time the
// learner was active — if they then miss a day, that stored value
// is stale until they do another activity. Without this guard the
// topbar happily shows "5 day streak" to a learner whose streak
// silently broke two days ago, which is the kind of soft lie the
// audit flagged as a trust risk.
//
// Pure (no Date.now() call) so it stays trivially testable; the
// caller passes today / yesterday strings.
export function getActiveStreakDays(streakDays, lastDate, today, yesterday) {
  if (!Number.isFinite(streakDays) || streakDays <= 0) return 0;
  if (!lastDate) return 0;
  if (lastDate === today || lastDate === yesterday) return streakDays;
  return 0;
}
