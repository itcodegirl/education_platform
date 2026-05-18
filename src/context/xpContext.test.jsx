/* @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useXP, XPContext } from './xpContext';

describe('useXP default context values', () => {
  it('returns xpTotal of 0', () => {
    const { result } = renderHook(() => useXP());
    expect(result.current.xpTotal).toBe(0);
  });

  it('returns streak and dailyCount of 0', () => {
    const { result } = renderHook(() => useXP());
    expect(result.current.streak).toBe(0);
    expect(result.current.dailyCount).toBe(0);
  });

  it('returns null for xpPopup, pausedStreak, and newBadge', () => {
    const { result } = renderHook(() => useXP());
    expect(result.current.xpPopup).toBeNull();
    expect(result.current.pausedStreak).toBeNull();
    expect(result.current.newBadge).toBeNull();
  });

  it('returns empty array for earnedBadges', () => {
    const { result } = renderHook(() => useXP());
    expect(Array.isArray(result.current.earnedBadges)).toBe(true);
    expect(result.current.earnedBadges).toHaveLength(0);
  });

  it('exposes noop functions for awardXP, clearXPPopup, clearNewBadge, recordDailyActivity', () => {
    const { result } = renderHook(() => useXP());
    expect(typeof result.current.awardXP).toBe('function');
    expect(typeof result.current.clearXPPopup).toBe('function');
    expect(typeof result.current.clearNewBadge).toBe('function');
    expect(typeof result.current.recordDailyActivity).toBe('function');
  });

  it('noop functions do not throw when called', () => {
    const { result } = renderHook(() => useXP());
    expect(() => result.current.awardXP(10)).not.toThrow();
    expect(() => result.current.clearXPPopup()).not.toThrow();
    expect(() => result.current.clearNewBadge()).not.toThrow();
    expect(() => result.current.recordDailyActivity()).not.toThrow();
  });
});

describe('XPContext shape', () => {
  it('exports a React context', () => {
    expect(XPContext).toBeTruthy();
    expect(typeof XPContext.Provider).toBe('object');
  });
});
