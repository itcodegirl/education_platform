/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDailyActivity } from './useDailyActivity';

const user = { id: 'learner-a' };
const createProgressWrite = vi.fn((operation, payload) => ({
  id: 'env-' + Math.random().toString(36).slice(2),
  operation,
  payload,
}));

let originalDateNow;
const FIXED_TODAY = '2026-05-08';
const FIXED_YESTERDAY = '2026-05-07';

beforeEach(() => {
  // Pin `Date.now()` so the helpers' getTodayString returns FIXED_TODAY
  // and getYesterdayString returns FIXED_YESTERDAY. Both helpers go
  // through new Date().toISOString().slice(0, 10).
  originalDateNow = Date.now;
  const fixedTime = new Date('2026-05-08T12:00:00Z').getTime();
  Date.now = () => fixedTime;
  // Also stub the Date constructor for the no-argument case so
  // toISOString returns the pinned date.
  vi.useFakeTimers({ now: fixedTime });
  createProgressWrite.mockClear();
});

afterEach(() => {
  Date.now = originalDateNow;
  vi.useRealTimers();
});

describe('useDailyActivity', () => {
  it('starts at zero and refuses writes when user is null', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useDailyActivity({ user: null, dbWrite, createProgressWrite }));

    expect(result.current.streak).toBe(0);
    expect(result.current.dailyCount).toBe(0);

    await act(async () => {
      await result.current.recordDailyActivity();
    });
    expect(dbWrite).not.toHaveBeenCalled();
  });

  it('first activity of a fresh learner yields streak=1, dailyCount=1, two writes', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useDailyActivity({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.recordDailyActivity();
    });

    expect(result.current.streak).toBe(1);
    expect(result.current.streakLastDate).toBe(FIXED_TODAY);
    expect(result.current.dailyCount).toBe(1);
    expect(result.current.dailyDate).toBe(FIXED_TODAY);
    expect(dbWrite).toHaveBeenCalledTimes(2);
    expect(dbWrite).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'updateStreak' }),
      'updateStreak',
    );
    expect(dbWrite).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'updateDailyGoal' }),
      'updateDailyGoal',
    );
  });

  it('two recordDailyActivity calls in the same tick increment dailyCount twice', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useDailyActivity({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      await Promise.all([
        result.current.recordDailyActivity(),
        result.current.recordDailyActivity(),
      ]);
    });

    expect(result.current.dailyCount).toBe(2);
    // Streak should only be written once (same day).
    const streakWrites = dbWrite.mock.calls.filter(([, label]) => label === 'updateStreak');
    expect(streakWrites).toHaveLength(1);
    const dailyWrites = dbWrite.mock.calls.filter(([, label]) => label === 'updateDailyGoal');
    expect(dailyWrites).toHaveLength(2);
  });

  it('continues a streak when yesterday was the last activity day', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useDailyActivity({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      result.current.replaceStreak(3, FIXED_YESTERDAY);
    });

    await act(async () => {
      await result.current.recordDailyActivity();
    });

    expect(result.current.streak).toBe(4);
    expect(result.current.streakLastDate).toBe(FIXED_TODAY);
  });

  it('resets streak to 1 when last activity was older than yesterday', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useDailyActivity({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      result.current.replaceStreak(7, '2026-04-01');
    });

    await act(async () => {
      await result.current.recordDailyActivity();
    });

    expect(result.current.streak).toBe(1);
  });

  it('replaceDailyGoal seeds the count; resetStreakAndDaily clears both', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useDailyActivity({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      result.current.replaceStreak(5, FIXED_TODAY);
      result.current.replaceDailyGoal(2, FIXED_TODAY);
    });

    expect(result.current.streak).toBe(5);
    expect(result.current.dailyCount).toBe(2);

    await act(async () => {
      result.current.resetStreakAndDaily();
    });

    expect(result.current.streak).toBe(0);
    expect(result.current.streakLastDate).toBe('');
    expect(result.current.dailyCount).toBe(0);
    expect(result.current.dailyDate).toBe('');
  });
});
