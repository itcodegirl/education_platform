/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLessonMarkDone } from './useLessonMarkDone';

vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));

import { trackEvent } from '../lib/analytics';

const makeProps = (overrides = {}) => ({
  completedSet: new Set(),
  stableLessonKey: 'html|m1|l1',
  legacyLessonKey: 'html_m1_l1',
  courseId: 'html',
  moduleId: 'm1',
  lessonId: 'l1',
  mutationActionPath: '/learn/html',
  progressMutation: { submit: vi.fn() },
  toggleLessonDone: vi.fn(),
  lessonViewStartRef: { current: Date.now() - 5000 },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useLessonMarkDone', () => {
  it('starts with marking=false', () => {
    const { result } = renderHook(() => useLessonMarkDone(makeProps()));
    expect(result.current.marking).toBe(false);
  });

  it('sets marking=true immediately when handleMarkDone is called', async () => {
    const props = makeProps();
    const { result } = renderHook(() => useLessonMarkDone(props));

    await act(async () => {
      result.current.handleMarkDone();
    });

    // Still within the 350ms feedback window — marking stays true
    expect(result.current.marking).toBe(true);
  });

  it('resets marking=false after the minimum feedback delay', async () => {
    const props = makeProps();
    const { result } = renderHook(() => useLessonMarkDone(props));

    await act(async () => {
      result.current.handleMarkDone();
    });

    expect(result.current.marking).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current.marking).toBe(false);
  });

  it('calls toggleLessonDone with stableLessonKey when lesson is not done', async () => {
    const props = makeProps();
    const { result } = renderHook(() => useLessonMarkDone(props));

    await act(async () => {
      result.current.handleMarkDone();
      vi.advanceTimersByTime(350);
    });

    expect(props.toggleLessonDone).toHaveBeenCalledWith('html|m1|l1', { skipRemote: true });
  });

  it('submits complete mutation when lesson is not done', async () => {
    const props = makeProps();
    const { result } = renderHook(() => useLessonMarkDone(props));

    await act(async () => {
      result.current.handleMarkDone();
      vi.advanceTimersByTime(350);
    });

    expect(props.progressMutation.submit).toHaveBeenCalledWith(
      { intent: 'toggle-progress', mode: 'complete', lessonKey: 'html|m1|l1' },
      { method: 'post', action: '/learn/html' },
    );
  });

  it('submits uncomplete mutation when stable lesson key is already done', async () => {
    const props = makeProps({ completedSet: new Set(['html|m1|l1']) });
    const { result } = renderHook(() => useLessonMarkDone(props));

    await act(async () => {
      result.current.handleMarkDone();
      vi.advanceTimersByTime(350);
    });

    expect(props.progressMutation.submit).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'uncomplete', lessonKey: 'html|m1|l1' }),
      expect.anything(),
    );
  });

  it('falls back to legacyLessonKey when only legacy key is in completedSet', async () => {
    const props = makeProps({ completedSet: new Set(['html_m1_l1']) });
    const { result } = renderHook(() => useLessonMarkDone(props));

    await act(async () => {
      result.current.handleMarkDone();
      vi.advanceTimersByTime(350);
    });

    expect(props.progressMutation.submit).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'uncomplete', lessonKey: 'html_m1_l1' }),
      expect.anything(),
    );
  });

  it('fires lesson_completion_toggled with marked_complete when completing', async () => {
    const props = makeProps();
    const { result } = renderHook(() => useLessonMarkDone(props));

    await act(async () => {
      result.current.handleMarkDone();
      vi.advanceTimersByTime(350);
    });

    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith(
      'lesson_completion_toggled',
      expect.objectContaining({
        courseId: 'html',
        moduleId: 'm1',
        lessonId: 'l1',
        completionState: 'marked_complete',
      }),
    );
  });

  it('fires lesson_completion_toggled with unmarked when un-completing', async () => {
    const props = makeProps({ completedSet: new Set(['html|m1|l1']) });
    const { result } = renderHook(() => useLessonMarkDone(props));

    await act(async () => {
      result.current.handleMarkDone();
      vi.advanceTimersByTime(350);
    });

    expect(trackEvent).toHaveBeenCalledWith(
      'lesson_completion_toggled',
      expect.objectContaining({ completionState: 'unmarked' }),
    );
  });

  it('includes a non-negative secondsOnLesson in analytics payload', async () => {
    const props = makeProps();
    const { result } = renderHook(() => useLessonMarkDone(props));

    await act(async () => {
      result.current.handleMarkDone();
      vi.advanceTimersByTime(350);
    });

    const payload = trackEvent.mock.calls[0][1];
    expect(payload.secondsOnLesson).toBeGreaterThanOrEqual(0);
  });

  it('ignores concurrent calls while marking is true', async () => {
    const props = makeProps();
    const { result } = renderHook(() => useLessonMarkDone(props));

    await act(async () => {
      result.current.handleMarkDone();
    });

    // Call again while still within feedback delay
    await act(async () => {
      result.current.handleMarkDone();
    });

    // Should only have toggled once
    expect(props.toggleLessonDone).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(350);
    });
  });
});
