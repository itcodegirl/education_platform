import { XP_VALUES } from '../utils/helpers';

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
