// Per-learner localStorage helpers for the optimistic state slices
// that ProgressContext needs to survive a page reload before the
// canonical Supabase fetch finishes (reward history, challenge
// completions). Pure read/write/normalize functions extracted from
// ProgressContext so they can be unit-tested without setting up the
// full provider tree.

const REWARD_HISTORY_PREFIX = 'chw-reward-history';
const CHALLENGE_COMPLETIONS_PREFIX = 'chw-challenge-completions';

function getRewardHistoryStorageKey(userId) {
  return `${REWARD_HISTORY_PREFIX}:${userId}`;
}

function getChallengeCompletionStorageKey(userId) {
  return `${CHALLENGE_COMPLETIONS_PREFIX}:${userId}`;
}

export function normalizeStringList(values) {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => value.trim()),
    ),
  );
}

// Reward history is just a deduped list of reward keys. The
// dedicated alias keeps call sites readable.
export const normalizeRewardHistory = normalizeStringList;

function getStorage(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  return storage;
}

export function readRewardHistory(userId, options = {}) {
  if (!userId) return [];
  const storage = getStorage(options.storage);
  if (!storage) return [];

  try {
    const raw = storage.getItem(getRewardHistoryStorageKey(userId));
    return normalizeStringList(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export function writeRewardHistory(userId, keys, options = {}) {
  if (!userId) return;
  const storage = getStorage(options.storage);
  if (!storage) return;

  storage.setItem(
    getRewardHistoryStorageKey(userId),
    JSON.stringify(normalizeStringList(keys)),
  );
}

export function readChallengeCompletions(userId, options = {}) {
  if (!userId) return [];
  const storage = getStorage(options.storage);
  if (!storage) return [];

  try {
    const raw = storage.getItem(getChallengeCompletionStorageKey(userId));
    return normalizeStringList(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
}

export function writeChallengeCompletions(userId, challengeIds, options = {}) {
  if (!userId) return;
  const storage = getStorage(options.storage);
  if (!storage) return;

  storage.setItem(
    getChallengeCompletionStorageKey(userId),
    JSON.stringify(normalizeStringList(challengeIds)),
  );
}
