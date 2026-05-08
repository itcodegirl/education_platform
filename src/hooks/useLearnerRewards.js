// useLearnerRewards — owns the localStorage-backed reward dedup
// surface for the active learner. Two parallel records:
//
//   rewardHistory          — set of reward keys that have already
//                            been awarded (lesson_complete:<key>,
//                            quiz_perfect:<key>, …). Used by the
//                            reward engine to decide whether a
//                            given event should fire XP again.
//   challengeCompletions   — set of challenge IDs that have been
//                            graded as passed at least once. Used
//                            by ChallengesPanel to render completed
//                            state.
//
// Persistence is per-learner localStorage (utils/learnerLocalStore).
// Cross-device sync still depends on the backend reward path that
// is documented as deferred in KNOWN_LIMITATIONS.md.

import { useCallback, useRef, useState } from 'react';
import {
  normalizeRewardHistory,
  normalizeStringList as normalizeStringSet,
  writeChallengeCompletions,
  writeRewardHistory,
} from '../utils/learnerLocalStore';

export function useLearnerRewards({ user, markSyncFailed }) {
  const [rewardHistory, setRewardHistory] = useState([]);
  const rewardHistoryRef = useRef(new Set());

  const [challengeCompletions, setChallengeCompletions] = useState([]);
  const challengeCompletionsRef = useRef(new Set());

  const replaceRewardHistory = useCallback((userId, keys, { persist = false } = {}) => {
    const normalizedKeys = normalizeRewardHistory(keys);
    rewardHistoryRef.current = new Set(normalizedKeys);
    setRewardHistory(normalizedKeys);

    if (persist) {
      try {
        writeRewardHistory(userId, normalizedKeys);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[useLearnerRewards] reward history write failed:', err);
        }
        markSyncFailed('reward-history-local');
      }
    }
  }, [markSyncFailed]);

  const replaceChallengeCompletions = useCallback((userId, challengeIds, { persist = false } = {}) => {
    const normalizedChallengeIds = normalizeStringSet(challengeIds);
    challengeCompletionsRef.current = new Set(normalizedChallengeIds);
    setChallengeCompletions(normalizedChallengeIds);

    if (persist) {
      try {
        writeChallengeCompletions(userId, normalizedChallengeIds);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[useLearnerRewards] challenge completion write failed:', err);
        }
        markSyncFailed('challenge-completions-local');
      }
    }
  }, [markSyncFailed]);

  const resetLearnerRewards = useCallback(() => {
    rewardHistoryRef.current = new Set();
    setRewardHistory([]);
    challengeCompletionsRef.current = new Set();
    setChallengeCompletions([]);
  }, []);

  const hasRewardBeenAwarded = useCallback((rewardKey) => (
    rewardHistoryRef.current.has(rewardKey)
  ), []);

  const markRewardAwarded = useCallback((rewardKey) => {
    if (!user || typeof rewardKey !== 'string' || !rewardKey.trim()) return false;
    const normalizedRewardKey = rewardKey.trim();

    if (rewardHistoryRef.current.has(normalizedRewardKey)) return false;

    const nextKeys = [...rewardHistoryRef.current, normalizedRewardKey];
    rewardHistoryRef.current = new Set(nextKeys);
    setRewardHistory(nextKeys);

    try {
      writeRewardHistory(user.id, nextKeys);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[useLearnerRewards] reward history write failed:', err);
      }
      markSyncFailed('reward-history-local');
    }

    return true;
  }, [markSyncFailed, user]);

  const isChallengeCompleted = useCallback((challengeId) => {
    if (typeof challengeId !== 'string' || !challengeId.trim()) return false;
    return challengeCompletionsRef.current.has(challengeId.trim());
  }, []);

  const markChallengeCompleted = useCallback((challengeId) => {
    if (!user || typeof challengeId !== 'string' || !challengeId.trim()) return false;
    const normalizedChallengeId = challengeId.trim();

    if (challengeCompletionsRef.current.has(normalizedChallengeId)) return false;

    const nextChallengeIds = [...challengeCompletionsRef.current, normalizedChallengeId];
    challengeCompletionsRef.current = new Set(nextChallengeIds);
    setChallengeCompletions(nextChallengeIds);

    try {
      writeChallengeCompletions(user.id, nextChallengeIds);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[useLearnerRewards] challenge completion write failed:', err);
      }
      markSyncFailed('challenge-completions-local');
    }

    return true;
  }, [markSyncFailed, user]);

  return {
    rewardHistory,
    hasRewardBeenAwarded,
    markRewardAwarded,
    challengeCompletions,
    isChallengeCompleted,
    markChallengeCompleted,
    replaceRewardHistory,
    replaceChallengeCompletions,
    resetLearnerRewards,
  };
}
