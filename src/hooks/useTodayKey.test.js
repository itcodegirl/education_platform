/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTodayKey } from './useTodayKey';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTodayKey', () => {
  it('returns the current UTC date as YYYY-MM-DD on initial render', () => {
    vi.setSystemTime(new Date('2025-05-10T08:00:00.000Z'));

    const { result } = renderHook(() => useTodayKey());
    expect(result.current).toBe('2025-05-10');
  });

  it('ticks to the next day after midnight UTC', () => {
    vi.setSystemTime(new Date('2025-05-10T23:30:00.000Z'));

    const { result } = renderHook(() => useTodayKey());
    expect(result.current).toBe('2025-05-10');

    // Advance past midnight; the scheduled timer fires and the
    // date key updates.
    act(() => {
      vi.advanceTimersByTime(35 * 60 * 1000);
    });
    expect(result.current).toBe('2025-05-11');
  });

  it('refreshes immediately on visibilitychange when wall time is now ahead', () => {
    vi.setSystemTime(new Date('2025-05-10T23:50:00.000Z'));

    const { result } = renderHook(() => useTodayKey());
    expect(result.current).toBe('2025-05-10');

    // Simulate the tab going to background, machine sleeping,
    // and waking up the next day. Without re-firing the
    // setTimeout (which sleep can pause), the visibilitychange
    // listener handles it.
    vi.setSystemTime(new Date('2025-05-12T09:00:00.000Z'));
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe('2025-05-12');
  });

  it('does not re-render when visibility changes but the date is unchanged', () => {
    vi.setSystemTime(new Date('2025-05-10T08:00:00.000Z'));

    let renders = 0;
    renderHook(() => {
      renders += 1;
      return useTodayKey();
    });
    const initialRenders = renders;

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    // The setState is functional — same value short-circuits.
    expect(renders).toBe(initialRenders);
  });

  it('cleans up timers and listeners on unmount', () => {
    vi.setSystemTime(new Date('2025-05-10T23:50:00.000Z'));

    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useTodayKey());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });
});
