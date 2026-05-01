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
