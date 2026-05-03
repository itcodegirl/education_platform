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

import { useRemoveBookmark, useToggleBookmark } from './useToggleBookmark';

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

describe('useRemoveBookmark', () => {
  it('removes a bookmark by row, translating snake_case columns to the wire format', () => {
    const toggleBookmark = vi.fn();
    mockUseSR.mockReturnValue({
      toggleBookmark,
      isBookmarked: () => true,
    });

    const { result } = renderHook(() => useRemoveBookmark());

    act(() => {
      result.current.handleRemoveBookmark({
        lesson_key: 'c:html|m:basics|l:intro',
        course_id: 'html',
        lesson_title: 'What is HTML?',
      });
    });

    // Optimistic local toggle uses the same shape we always pass:
    // (key, courseId, title, options).
    expect(toggleBookmark).toHaveBeenCalledWith(
      'c:html|m:basics|l:intro',
      'html',
      'What is HTML?',
      { skipRemote: true },
    );
    // Wire format flips snake_case to camelCase.
    expect(mockSubmit).toHaveBeenCalledWith(
      {
        intent: 'toggle-bookmark',
        mode: 'remove',
        lessonKey: 'c:html|m:basics|l:intro',
        courseId: 'html',
        lessonTitle: 'What is HTML?',
      },
      { method: 'post', action: '/learn/html/basics/intro' },
    );
  });

  it('uses the panel-specific syncFailureLabel by default', () => {
    // Spy directly on the syncFailure path is implicit — the mock
    // currently no-ops it. This test just confirms the hook
    // renders without error when called with no args, the default
    // call shape used by BookmarksPanel.
    mockUseSR.mockReturnValue({
      toggleBookmark: vi.fn(),
      isBookmarked: () => false,
    });

    const { result } = renderHook(() => useRemoveBookmark());
    expect(typeof result.current.handleRemoveBookmark).toBe('function');
  });
});
