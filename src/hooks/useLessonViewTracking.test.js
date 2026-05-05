/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLessonViewTracking } from './useLessonViewTracking';

vi.mock('../lib/analytics', () => ({ trackEvent: vi.fn() }));

import { trackEvent } from '../lib/analytics';

const BASE = {
  courseId: 'html',
  moduleId: 'm1',
  lessonId: 'l1',
  courseIndex: 0,
  moduleIndex: 0,
  lessonIndex: 0,
  showModQuiz: false,
};

beforeEach(() => vi.clearAllMocks());

describe('useLessonViewTracking', () => {
  it('fires lesson_viewed with correct payload on mount', () => {
    renderHook(() => useLessonViewTracking(BASE));

    expect(trackEvent).toHaveBeenCalledOnce();
    expect(trackEvent).toHaveBeenCalledWith('lesson_viewed', {
      courseId: 'html',
      moduleId: 'm1',
      lessonId: 'l1',
      courseIndex: 0,
      moduleIndex: 0,
      lessonIndex: 0,
    });
  });

  it('does not fire when showModQuiz is true', () => {
    renderHook(() => useLessonViewTracking({ ...BASE, showModQuiz: true }));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not fire when courseId is empty', () => {
    renderHook(() => useLessonViewTracking({ ...BASE, courseId: '' }));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not fire when lessonId is empty', () => {
    renderHook(() => useLessonViewTracking({ ...BASE, lessonId: '' }));
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('fires again when lessonId changes', () => {
    const { rerender } = renderHook((p) => useLessonViewTracking(p), {
      initialProps: BASE,
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);

    rerender({ ...BASE, lessonId: 'l2', lessonIndex: 1 });

    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenLastCalledWith('lesson_viewed', expect.objectContaining({
      lessonId: 'l2',
      lessonIndex: 1,
    }));
  });

  it('does not re-fire for the same lesson identity on unrelated prop changes', () => {
    const { rerender } = renderHook((p) => useLessonViewTracking(p), {
      initialProps: BASE,
    });

    expect(trackEvent).toHaveBeenCalledTimes(1);

    // courseIndex changes but courseId|moduleId|lessonId identity is the same
    rerender({ ...BASE, courseIndex: 1 });

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('returns a ref with a timestamp close to Date.now()', () => {
    const before = Date.now();
    const { result } = renderHook(() => useLessonViewTracking(BASE));
    const after = Date.now();

    expect(result.current.current).toBeGreaterThanOrEqual(before);
    expect(result.current.current).toBeLessThanOrEqual(after);
  });
});
