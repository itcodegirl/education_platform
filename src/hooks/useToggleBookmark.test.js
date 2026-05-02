/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const { mockUseSR, mockUseProgressData, mockUseFetcher, mockUseLocation, mockSubmit } = vi.hoisted(() => ({
  mockUseSR: vi.fn(),
  mockUseProgressData: vi.fn(),
  mockUseFetcher: vi.fn(),
  mockUseLocation: vi.fn(),
  mockSubmit: vi.fn(),
}));

vi.mock('../providers', () => ({
  useSR: () => mockUseSR(),
  useProgressData: () => mockUseProgressData(),
}));

vi.mock('react-router-dom', () => ({
  useFetcher: () => mockUseFetcher(),
  useLocation: () => mockUseLocation(),
}));

vi.mock('./useFetcherSyncFailure', () => ({
  useFetcherSyncFailure: () => {},
}));

import { useToggleBookmark } from './useToggleBookmark';

const baseArgs = {
  lessonKey: 'c:html|m:basics|l:intro',
  courseId: 'html',
  lessonTitle: 'What is HTML?',
};

beforeEach(() => {
  mockUseProgressData.mockReturnValue({
    markSyncFailed: vi.fn(),
    enqueuePendingSyncWrite: vi.fn(),
  });
  mockUseFetcher.mockReturnValue({ submit: mockSubmit, state: 'idle', data: null });
  mockUseLocation.mockReturnValue({ pathname: '/learn/html/basics/intro' });
  mockSubmit.mockReset();
});

describe('useToggleBookmark', () => {
  it('exposes the current bookmark state through isBookmarked', () => {
    mockUseSR.mockReturnValue({
      toggleBookmark: vi.fn(),
      isBookmarked: () => true,
    });

    const { result } = renderHook(() => useToggleBookmark(baseArgs));
    expect(result.current.bookmarked).toBe(true);
  });

  it('on first toggle (not bookmarked): optimistic save + submit save', () => {
    const toggleBookmark = vi.fn();
    mockUseSR.mockReturnValue({
      toggleBookmark,
      isBookmarked: () => false,
    });

    const { result } = renderHook(() => useToggleBookmark(baseArgs));

    act(() => {
      result.current.handleToggleBookmark();
    });

    expect(toggleBookmark).toHaveBeenCalledWith(
      'c:html|m:basics|l:intro',
      'html',
      'What is HTML?',
      { skipRemote: true },
    );
    expect(mockSubmit).toHaveBeenCalledWith(
      {
        intent: 'toggle-bookmark',
        mode: 'save',
        lessonKey: 'c:html|m:basics|l:intro',
        courseId: 'html',
        lessonTitle: 'What is HTML?',
      },
      { method: 'post', action: '/learn/html/basics/intro' },
    );
  });

  it('on toggle when already bookmarked: optimistic remove + submit remove', () => {
    const toggleBookmark = vi.fn();
    mockUseSR.mockReturnValue({
      toggleBookmark,
      isBookmarked: () => true,
    });

    const { result } = renderHook(() => useToggleBookmark(baseArgs));

    act(() => {
      result.current.handleToggleBookmark();
    });

    expect(toggleBookmark).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'remove' }),
      expect.any(Object),
    );
  });

  it('uses the current location.pathname as the action URL', () => {
    mockUseSR.mockReturnValue({
      toggleBookmark: vi.fn(),
      isBookmarked: () => false,
    });
    mockUseLocation.mockReturnValue({ pathname: '/learn/css/selectors/specificity' });

    const { result } = renderHook(() => useToggleBookmark(baseArgs));

    act(() => {
      result.current.handleToggleBookmark();
    });

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ action: '/learn/css/selectors/specificity' }),
    );
  });
});
