import { XP_VALUES } from '../utils/helpers';

// Two REWARD_EVENT_TYPES vocabularies exist on purpose:
//
//   - this one (lowercase) — drives the LEGACY reward keys persisted in
//     learner localStorage (`lesson_complete:<lessonKey>`, …). It is
//     consumed by REWARD_KEY_PREFIX_BY_TYPE / `createRewardKey` /
//     `rewardKeys.*` below to keep same-device dedup wire-compatible
//     with progress data already on disk.
//
//   - `src/engine/rewards/rewardEventTypes.js` (uppercase) — drives the
//     RUNTIME reward-event records that flow through the local ledger
//     and the Supabase `award_reward_event` RPC. Those events use
//     `LESSON_COMPLETE`, `QUIZ_BASE`, `QUIZ_PERFECT`, `CHALLENGE_COMPLETE`.
//
// Same four conceptual events, two naming styles, two stored shapes.
// Collapsing them is possible but requires migrating already-persisted
// reward-key strings and is intentionally out of scope. See
// `docs/learning-engine.md` §8.
export const REWARD_EVENT_TYPES = Object.freeze({
  lessonComplete: 'lesson_complete',
  quizComplete: 'quiz_complete',
  quizPerfect: 'quiz_perfect',
  challengeComplete: 'challenge_complete',
});

export const REWARD_XP = Object.freeze({
  lessonComplete: XP_VALUES.lesson,
  quizComplete: XP_VALUES.quiz,
  quizPerfect: XP_VALUES.perfectQuiz,
  challengeComplete: XP_VALUES.challenge,
});

export const STREAK_QUALIFYING_ACTIONS = Object.freeze([
  REWARD_EVENT_TYPES.lessonComplete,
  REWARD_EVENT_TYPES.quizComplete,
  REWARD_EVENT_TYPES.quizPerfect,
  REWARD_EVENT_TYPES.challengeComplete,
]);

const REWARD_KEY_PREFIX_BY_TYPE = Object.freeze({
  [REWARD_EVENT_TYPES.lessonComplete]: 'lesson_complete',
  [REWARD_EVENT_TYPES.quizComplete]: 'quiz_complete',
  [REWARD_EVENT_TYPES.quizPerfect]: 'quiz_perfect',
  [REWARD_EVENT_TYPES.challengeComplete]: 'challenge_complete',
});

function normalizeRewardIdentifier(identifier, label) {
  if (typeof identifier !== 'string' || identifier.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return identifier.trim();
}

export function createRewardKey(type, identifier) {
  const prefix = REWARD_KEY_PREFIX_BY_TYPE[type];

  if (!prefix) {
    throw new Error(`Unsupported reward event type: ${type}`);
  }

  return `${prefix}:${normalizeRewardIdentifier(identifier, 'reward identifier')}`;
}

export const rewardKeys = Object.freeze({
  lessonComplete: (lessonKey) => createRewardKey(REWARD_EVENT_TYPES.lessonComplete, lessonKey),
  quizComplete: (quizKey) => createRewardKey(REWARD_EVENT_TYPES.quizComplete, quizKey),
  quizPerfect: (quizKey) => createRewardKey(REWARD_EVENT_TYPES.quizPerfect, quizKey),
  challengeComplete: (challengeId) => createRewardKey(REWARD_EVENT_TYPES.challengeComplete, challengeId),
});

export function isStreakQualifyingAction(type) {
  return STREAK_QUALIFYING_ACTIONS.includes(type);
}

export function formatQuizScore(score, total) {
  return `${score}/${total}`;
}

// Single source of truth for the score-to-percent calculation. Returns
// 0 (instead of NaN) for a malformed total so callers can render the
// derived value without special-casing. Both useQuizSession.handleSubmit
// and learningEngine.submitQuiz route through this so the two quiz
// paths can't drift on rounding behaviour.
export function quizPercent(score, total) {
  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.round((score / total) * 100);
}

export function parseQuizScore(scoreValue) {
  if (typeof scoreValue !== 'string') return null;
  const [scoreRaw, totalRaw] = scoreValue.split('/');
  const score = Number(scoreRaw);
  const total = Number(totalRaw);

  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  return {
    score,
    total,
    pct: Math.round((score / total) * 100),
  };
}

export function isPerfectQuizScore(scoreValue) {
  const parsed = parseQuizScore(scoreValue);
  return Boolean(parsed && parsed.score === parsed.total && parsed.total > 0);
}

export function isQuizScoreImprovement(currentScoreValue, nextScore, nextTotal) {
  const current = parseQuizScore(currentScoreValue);
  const next = parseQuizScore(formatQuizScore(nextScore, nextTotal));

  if (!next) return false;
  if (!current) return true;
  if (next.pct !== current.pct) return next.pct > current.pct;

  return next.score > current.score;
}

export const REWARD_POLICY = Object.freeze({
  xpAwardRules: Object.freeze({
    lessonCompletion: 'Award lesson XP once per stable lesson key.',
    quizCompletion: 'Award base quiz XP once per stable quiz key.',
    quizPerfect: 'Award the perfect-score bonus once per stable quiz key.',
    challengeCompletion: 'Award challenge XP once per stable challenge ID.',
  }),
  quizRetryRules: Object.freeze({
    retriesAllowed: true,
    updateBestScore: true,
    repeatBaseXp: false,
    repeatPerfectBonus: false,
  }),
  streakRules: Object.freeze({
    appLoadCounts: false,
    qualifyingActions: STREAK_QUALIFYING_ACTIONS,
  }),
  persistenceRules: Object.freeze({
    rewardCriticalActionsMustBeIdempotent: true,
    preferredFutureStorage: 'reward-event records or equivalent stable tracking',
    failedWritesMustBeVisibleOrRetryable: true,
  }),
});
