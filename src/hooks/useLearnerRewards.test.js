/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLearnerRewards } from './useLearnerRewards';

function makeHandlers(user = { id: 'u1' }) {
  return { user, markSyncFailed: vi.fn() };
}

describe('useLearnerRewards initial state', () => {
  it('starts with empty rewardHistory', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    expect(result.current.rewardHistory).toEqual([]);
  });

  it('starts with empty challengeCompletions', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    expect(result.current.challengeCompletions).toEqual([]);
  });
});

describe('hasRewardBeenAwarded', () => {
  it('returns false for unknown key', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    expect(result.current.hasRewardBeenAwarded('lesson_complete:l:html:1')).toBe(false);
  });

  it('returns true after markRewardAwarded', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    act(() => { result.current.markRewardAwarded('lesson_complete:l:html:1'); });
    expect(result.current.hasRewardBeenAwarded('lesson_complete:l:html:1')).toBe(true);
  });
});

describe('markRewardAwarded', () => {
  it('returns false when user is null', () => {
    const { result } = renderHook(() => useLearnerRewards({ user: null, markSyncFailed: vi.fn() }));
    let ret;
    act(() => { ret = result.current.markRewardAwarded('key'); });
    expect(ret).toBe(false);
  });

  it('returns false for empty/whitespace key', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    let ret;
    act(() => { ret = result.current.markRewardAwarded('   '); });
    expect(ret).toBe(false);
  });

  it('returns true for a new key', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    let ret;
    act(() => { ret = result.current.markRewardAwarded('quiz_perfect:q1'); });
    expect(ret).toBe(true);
  });

  it('returns false when key was already awarded', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    act(() => { result.current.markRewardAwarded('key'); });
    let ret;
    act(() => { ret = result.current.markRewardAwarded('key'); });
    expect(ret).toBe(false);
  });

  it('adds key to rewardHistory state', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    act(() => { result.current.markRewardAwarded('lesson_complete:x'); });
    expect(result.current.rewardHistory).toContain('lesson_complete:x');
  });
});

describe('isChallengeCompleted and markChallengeCompleted', () => {
  it('isChallengeCompleted returns false initially', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    expect(result.current.isChallengeCompleted('challenge-1')).toBe(false);
  });

  it('markChallengeCompleted returns false when user is null', () => {
    const { result } = renderHook(() => useLearnerRewards({ user: null, markSyncFailed: vi.fn() }));
    let ret;
    act(() => { ret = result.current.markChallengeCompleted('c1'); });
    expect(ret).toBe(false);
  });

  it('markChallengeCompleted returns true for new challenge', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    let ret;
    act(() => { ret = result.current.markChallengeCompleted('c1'); });
    expect(ret).toBe(true);
  });

  it('markChallengeCompleted returns false when already completed', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    act(() => { result.current.markChallengeCompleted('c1'); });
    let ret;
    act(() => { ret = result.current.markChallengeCompleted('c1'); });
    expect(ret).toBe(false);
  });

  it('isChallengeCompleted returns true after marking', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    act(() => { result.current.markChallengeCompleted('c1'); });
    expect(result.current.isChallengeCompleted('c1')).toBe(true);
  });
});

describe('replaceRewardHistory and resetLearnerRewards', () => {
  it('replaceRewardHistory sets the reward history', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    act(() => {
      result.current.replaceRewardHistory('u1', ['lesson_complete:x', 'quiz_perfect:y']);
    });
    expect(result.current.rewardHistory).toContain('lesson_complete:x');
  });

  it('resetLearnerRewards clears rewards and challenges', () => {
    const { result } = renderHook(() => useLearnerRewards(makeHandlers()));
    act(() => { result.current.markRewardAwarded('key'); });
    act(() => { result.current.markChallengeCompleted('c1'); });
    act(() => { result.current.resetLearnerRewards(); });
    expect(result.current.rewardHistory).toEqual([]);
    expect(result.current.challengeCompletions).toEqual([]);
  });
});
