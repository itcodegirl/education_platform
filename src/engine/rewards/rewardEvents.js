import { REWARD_EVENT_TYPES } from './rewardEventTypes';

const REWARD_EVENT_KEY_PREFIX_BY_TYPE = Object.freeze({
  [REWARD_EVENT_TYPES.LESSON_COMPLETE]: 'lesson-complete',
  [REWARD_EVENT_TYPES.QUIZ_BASE]: 'quiz-base',
  [REWARD_EVENT_TYPES.QUIZ_PERFECT]: 'quiz-perfect',
  [REWARD_EVENT_TYPES.CHALLENGE_COMPLETE]: 'challenge-complete',
});

function normalizeKeyPart(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value.trim();
}

export function createRewardEventKey(type, targetId, learnerKey) {
  const prefix = REWARD_EVENT_KEY_PREFIX_BY_TYPE[type];

  if (!prefix) {
    throw new Error(`Unsupported reward event type: ${type}`);
  }

  return [
    prefix,
    normalizeKeyPart(targetId, 'reward target id'),
    normalizeKeyPart(learnerKey, 'learner key'),
  ].join(':');
}

export const rewardEventKeys = Object.freeze({
  lessonComplete: (lessonId, learnerKey) =>
    createRewardEventKey(REWARD_EVENT_TYPES.LESSON_COMPLETE, lessonId, learnerKey),
  quizBase: (quizKey, learnerKey) =>
    createRewardEventKey(REWARD_EVENT_TYPES.QUIZ_BASE, quizKey, learnerKey),
  quizPerfect: (quizKey, learnerKey) =>
    createRewardEventKey(REWARD_EVENT_TYPES.QUIZ_PERFECT, quizKey, learnerKey),
  challengeComplete: (challengeId, learnerKey) =>
    createRewardEventKey(REWARD_EVENT_TYPES.CHALLENGE_COMPLETE, challengeId, learnerKey),
});

export function createRewardEvent({
  type,
  targetId,
  learnerKey,
  createdAt = new Date().toISOString(),
  metadata = {},
}) {
  return {
    key: createRewardEventKey(type, targetId, learnerKey),
    type,
    targetId: normalizeKeyPart(targetId, 'reward target id'),
    learnerKey: normalizeKeyPart(learnerKey, 'learner key'),
    createdAt,
    metadata,
  };
}

