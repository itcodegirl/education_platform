/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './useIsMobile';

// jsdom does not implement matchMedia; we provide a minimal controllable stub.
function makeMockMQ(matches) {
  const listeners = [];
  return {
    matches,
    addEventListener: vi.fn((event, handler) => { if (event === 'change') listeners.push(handler); }),
    removeEventListener: vi.fn(),
    // helper to fire a change event in tests
    _fire: (newMatches) => listeners.forEach((fn) => fn({ matches: newMatches })),
  };
}

let mockMQ;

beforeEach(() => {
  mockMQ = makeMockMQ(false);
  vi.spyOn(window, 'matchMedia').mockReturnValue(mockMQ);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useIsMobile', () => {
  it('returns true when window.innerWidth is less than the breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(true);
  });

  it('returns false when window.innerWidth is at the breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 768 });
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);
  });

  it('returns false when window.innerWidth exceeds the breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);
  });

  it('updates to true when a matchMedia change event fires with matches=true', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);

    act(() => mockMQ._fire(true));
    expect(result.current).toBe(true);
  });

  it('updates to false when a matchMedia change event fires with matches=false', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    mockMQ = makeMockMQ(true);
    window.matchMedia.mockReturnValue(mockMQ);

    const { result } = renderHook(() => useIsMobile(768));
    act(() => mockMQ._fire(false));
    expect(result.current).toBe(false);
  });

  it('registers the media query with the correct breakpoint expression', () => {
    renderHook(() => useIsMobile(1024));
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 1023px)');
  });

  it('removes the event listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(mockMQ.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('uses 768 as the default breakpoint', () => {
    renderHook(() => useIsMobile());
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });
});
