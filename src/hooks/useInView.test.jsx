import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInView } from './useInView';

describe('useInView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete window.IntersectionObserver;
  });

  it('reducedMotionShowsContentWithoutObserver', async () => {
    const intersectionObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: intersectionObserver,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useInView());

    await waitFor(() => {
      expect(result.current[1]).toBe(true);
    });
    expect(intersectionObserver).not.toHaveBeenCalled();
  });
});
