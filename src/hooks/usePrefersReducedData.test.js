/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrefersReducedData } from './usePrefersReducedData';

const ORIGINAL_MATCH_MEDIA = window.matchMedia;
const ORIGINAL_CONNECTION = navigator.connection;

function mockMatchMedia({ reducedDataMatches = false, listeners } = {}) {
  window.matchMedia = vi.fn((query) => {
    const isReducedData = query.includes('prefers-reduced-data');
    const matches = isReducedData ? reducedDataMatches : false;
    const subject = {
      matches,
      media: query,
      addEventListener: vi.fn((_, handler) => {
        if (listeners && isReducedData) listeners.push(handler);
      }),
      removeEventListener: vi.fn(),
    };
    return subject;
  });
}

function mockConnection(saveData) {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: {
      saveData,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  });
}

beforeEach(() => {
  mockMatchMedia();
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: undefined,
  });
});

afterEach(() => {
  window.matchMedia = ORIGINAL_MATCH_MEDIA;
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: ORIGINAL_CONNECTION,
  });
});

describe('usePrefersReducedData', () => {
  it('returns false when neither signal is present', () => {
    const { result } = renderHook(() => usePrefersReducedData());
    expect(result.current).toBe(false);
  });

  it('returns true when navigator.connection.saveData is set', () => {
    mockConnection(true);
    const { result } = renderHook(() => usePrefersReducedData());
    expect(result.current).toBe(true);
  });

  it('returns true when prefers-reduced-data media query matches', () => {
    mockMatchMedia({ reducedDataMatches: true });
    const { result } = renderHook(() => usePrefersReducedData());
    expect(result.current).toBe(true);
  });

  it('updates when the prefers-reduced-data query flips', () => {
    const listeners = [];
    mockMatchMedia({ reducedDataMatches: false, listeners });
    const { result } = renderHook(() => usePrefersReducedData());
    expect(result.current).toBe(false);

    // Simulate the underlying preference flipping on. The hook
    // re-reads the current state via currentlyReduced(), so we have
    // to also update the matchMedia mock to reflect the new value.
    mockMatchMedia({ reducedDataMatches: true });
    act(() => {
      listeners.forEach((handler) => handler({ matches: true }));
    });
    expect(result.current).toBe(true);
  });
});
