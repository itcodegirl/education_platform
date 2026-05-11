export const GUEST_LEARNER_STORAGE_ID = 'guest';

export function getLearnerStorageId(userId) {
  if (typeof userId !== 'string' || !userId.trim()) {
    return GUEST_LEARNER_STORAGE_ID;
  }

  return userId.trim();
}

export function getLearnerStorageKey(baseKey, userId) {
  return `${baseKey}:${getLearnerStorageId(userId)}`;
}

export function getLegacyStorageKey(baseKey) {
  return baseKey;
}

