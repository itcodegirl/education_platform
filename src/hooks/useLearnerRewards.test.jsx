/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const stored = {
  rewards: new Map(),
  challenges: new Map(),
};

vi.mock('../utils/learnerLocalStore', () => ({
  normalizeRewardHistory: (keys) => {
    if (!Array.isArray(keys)) return [];
    return Array.from(new Set(keys.filter((k) => typeof k === 'string' && k.trim())))
      .map((k) => k.trim());
  },
  normalizeStringList: (ids) => {
    if (!Array.isArray(ids)) return [];
    return Array.from(new Set(ids.filter((k) => typeof k === 'string' && k.trim())))
      .map((k) => k.trim());
  },
  writeRewardHistory: (userId, keys) => {
    stored.rewards.set(userId, [...keys]);
  },
  writeChallengeCompletions: (userId, ids) => {
    stored.challenges.set(userId, [...ids]);
  },
}));

import { useLearnerRewards } from './useLearnerRewards';

const user = { id: 'learner-a' };

beforeEach(() => {
  stored.rewards.clear();
  stored.challenges.clear();
});

describe('useLearnerRewards', () => {
  it('starts empty and returns false for any reward query', () => {
    const markSyncFailed = vi.fn();
    const { result } = renderHook(() => useLearnerRewards({ user, markSyncFailed }));

    expect(result.current.rewardHistory).toEqual([]);
    expect(result.current.challengeCompletions).toEqual([]);
    expect(result.current.hasRewardBeenAwarded('lesson_complete:foo')).toBe(false);
    expect(result.current.isChallengeCompleted('chal-1')).toBe(false);
  });

  it('markRewardAwarded persists once and rejects repeated calls', () => {
    const markSyncFailed = vi.fn();
    const { result } = renderHook(() => useLearnerRewards({ user, markSyncFailed }));

    let outcome;
    act(() => {
      outcome = result.current.markRewardAwarded('lesson_complete:l1');
    });
    expect(outcome).toBe(true);
    expect(result.current.hasRewardBeenAwarded('lesson_complete:l1')).toBe(true);
    expect(stored.rewards.get('learner-a')).toEqual(['lesson_complete:l1']);

    let outcome2;
    act(() => {
      outcome2 = result.current.markRewardAwarded('lesson_complete:l1');
    });
    expect(outcome2).toBe(false);
    expect(stored.rewards.get('learner-a')).toEqual(['lesson_complete:l1']);
  });

  it('refuses markRewardAwarded when there is no user', () => {
    const markSyncFailed = vi.fn();
    const { result } = renderHook(() => useLearnerRewards({ user: null, markSyncFailed }));

    let outcome;
    act(() => {
      outcome = result.current.markRewardAwarded('lesson_complete:l1');
    });
    expect(outcome).toBe(false);
    expect(stored.rewards.size).toBe(0);
  });

  it('rejects empty/whitespace reward keys', () => {
    const markSyncFailed = vi.fn();
    const { result } = renderHook(() => useLearnerRewards({ user, markSyncFailed }));

    let outcomes;
    act(() => {
      outcomes = [
        result.current.markRewardAwarded(''),
        result.current.markRewardAwarded('   '),
        result.current.markRewardAwarded(undefined),
      ];
    });
    expect(outcomes).toEqual([false, false, false]);
  });

  it('markChallengeCompleted persists once and rejects repeated calls', () => {
    const markSyncFailed = vi.fn();
    const { result } = renderHook(() => useLearnerRewards({ user, markSyncFailed }));

    let outcome;
    act(() => {
      outcome = result.current.markChallengeCompleted('chal-1');
    });
    expect(outcome).toBe(true);
    expect(result.current.isChallengeCompleted('chal-1')).toBe(true);
    expect(stored.challenges.get('learner-a')).toEqual(['chal-1']);

    let outcome2;
    act(() => {
      outcome2 = result.current.markChallengeCompleted('chal-1');
    });
    expect(outcome2).toBe(false);
  });

  it('replaceRewardHistory hydrates without persisting by default', () => {
    const markSyncFailed = vi.fn();
    const { result } = renderHook(() => useLearnerRewards({ user, markSyncFailed }));

    act(() => {
      result.current.replaceRewardHistory('learner-a', ['a', 'b']);
    });
    expect(result.current.rewardHistory).toEqual(['a', 'b']);
    expect(stored.rewards.size).toBe(0);

    act(() => {
      result.current.replaceRewardHistory('learner-a', ['a', 'b', 'c'], { persist: true });
    });
    expect(stored.rewards.get('learner-a')).toEqual(['a', 'b', 'c']);
  });

  it('resetLearnerRewards clears both surfaces', () => {
    const markSyncFailed = vi.fn();
    const { result } = renderHook(() => useLearnerRewards({ user, markSyncFailed }));

    act(() => {
      result.current.markRewardAwarded('a');
      result.current.markChallengeCompleted('chal-1');
    });
    expect(result.current.rewardHistory).toEqual(['a']);
    expect(result.current.challengeCompletions).toEqual(['chal-1']);

    act(() => {
      result.current.resetLearnerRewards();
    });
    expect(result.current.rewardHistory).toEqual([]);
    expect(result.current.challengeCompletions).toEqual([]);
  });
});
