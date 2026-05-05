/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const { mockUseProgressData, mockUseFetcher, mockSubmit } = vi.hoisted(() => ({
  mockUseProgressData: vi.fn(),
  mockUseFetcher: vi.fn(),
  mockSubmit: vi.fn(),
}));

const { mockTrackEvent } = vi.hoisted(() => ({ mockTrackEvent: vi.fn() }));

vi.mock('../providers', () => ({
  useProgressData: () => mockUseProgressData(),
}));

vi.mock('react-router-dom', () => ({
  useFetcher: () => mockUseFetcher(),
}));

vi.mock('../lib/analytics', () => ({
  trackEvent: (...args) => mockTrackEvent(...args),
}));

vi.mock('./useFetcherSyncFailure', () => ({
  useFetcherSyncFailure: () => {},
}));

import { useMarkLessonDone } from './useMarkLessonDone';

const baseArgs = {
  completedSet: new Set(),
  stableLessonKey: 'c:html|m:basics|l:intro',
  legacyLessonKey: 'HTML|Basics|Intro',
  toggleLessonDone: vi.fn(),
  mutationActionPath: '/learn/html/basics/intro',
  analyticsContext: {
    courseId: 'html',
    moduleId: 'basics',
    lessonId: 'intro',
    lessonViewStartRef: { current: Date.now() - 1500 },
  },
};

beforeEach(() => {
  mockUseProgressData.mockReturnValue({
    markSyncFailed: vi.fn(),
    enqueuePendingSyncWrite: vi.fn(),
  });
  mockUseFetcher.mockReturnValue({ submit: mockSubmit, state: 'idle', data: null });
  mockSubmit.mockReset();
  mockTrackEvent.mockReset();
  baseArgs.toggleLessonDone.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useMarkLessonDone', () => {
  it('starts in the not-marking state', () => {
    const { result } = renderHook(() => useMarkLessonDone(baseArgs));
    expect(result.current.marking).toBe(false);
  });

  it('on mark-done with a fresh lesson: optimistic toggle, submit complete, analytics', async () => {
    const { result } = renderHook(() => useMarkLessonDone(baseArgs));

    await act(async () => {
      await result.current.handleMarkDone();
    });

    expect(baseArgs.toggleLessonDone).toHaveBeenCalledWith('c:html|m:basics|l:intro', { skipRemote: true });
    expect(mockSubmit).toHaveBeenCalledWith(
      {
        intent: 'toggle-progress',
        mode: 'complete',
        lessonKey: 'c:html|m:basics|l:intro',
      },
      { method: 'post', action: '/learn/html/basics/intro' },
    );
    expect(mockTrackEvent).toHaveBeenCalledWith('lesson_completion_toggled', expect.objectContaining({
      courseId: 'html',
      moduleId: 'basics',
      lessonId: 'intro',
      completionState: 'marked_complete',
    }));
  });

  it('on mark-done with a stable-key completion already present: submits uncomplete', async () => {
    const args = {
      ...baseArgs,
      completedSet: new Set(['c:html|m:basics|l:intro']),
    };
    const { result } = renderHook(() => useMarkLessonDone(args));

    await act(async () => {
      await result.current.handleMarkDone();
    });

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'uncomplete', lessonKey: 'c:html|m:basics|l:intro' }),
      expect.any(Object),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith('lesson_completion_toggled', expect.objectContaining({
      completionState: 'unmarked',
    }));
  });

  it('on mark-done with only the legacy key present: toggles the legacy key', async () => {
    // Migration case: an older save uses the label-derived key. The
    // toggle has to operate on that exact key, otherwise the row in
    // Supabase isn't removed.
    const args = {
      ...baseArgs,
      completedSet: new Set(['HTML|Basics|Intro']),
    };
    const { result } = renderHook(() => useMarkLessonDone(args));

    await act(async () => {
      await result.current.handleMarkDone();
    });

    expect(baseArgs.toggleLessonDone).toHaveBeenCalledWith('HTML|Basics|Intro', { skipRemote: true });
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'uncomplete', lessonKey: 'HTML|Basics|Intro' }),
      expect.any(Object),
    );
  });

  it('flips marking back to false after the min-feedback duration', async () => {
    const { result } = renderHook(() => useMarkLessonDone(baseArgs));

    await act(async () => {
      await result.current.handleMarkDone();
    });

    // The marking flag is held true by a setTimeout for at least
    // MARK_DONE_MIN_FEEDBACK_MS (~350ms). Wait it out with real
    // timers so we don't fight the fake-timer / waitFor mismatch.
    await waitFor(() => expect(result.current.marking).toBe(false), { timeout: 1500 });
  });
});
