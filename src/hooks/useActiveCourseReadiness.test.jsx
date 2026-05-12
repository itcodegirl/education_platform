import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  getActiveCourseReady,
  useActiveCourseReadiness,
} from './useActiveCourseReadiness';
import { useCourseContent } from '../providers';

vi.mock('../providers', () => ({
  useCourseContent: vi.fn(),
}));

describe('getActiveCourseReady', () => {
  it('treats the active course as ready when the provider reports it loaded', () => {
    expect(
      getActiveCourseReady({
        activeCourseMeta: { id: 'html' },
        isActiveCourseLoaded: true,
        isCourseLoaded: () => false,
      }),
    ).toBe(true);
  });

  it('falls back to checking the active course id in the provider cache', () => {
    expect(
      getActiveCourseReady({
        activeCourseMeta: { id: 'css' },
        isActiveCourseLoaded: false,
        isCourseLoaded: (courseId) => courseId === 'css',
      }),
    ).toBe(true);
  });

  it('keeps the shell in loading mode until an active course is loaded', () => {
    expect(
      getActiveCourseReady({
        activeCourseMeta: { id: 'react' },
        isActiveCourseLoaded: false,
        isCourseLoaded: () => false,
      }),
    ).toBe(false);
  });
});

describe('useActiveCourseReadiness', () => {
  it('sets the active course id and returns readiness', () => {
    const setActiveCourseId = vi.fn();
    useCourseContent.mockReturnValue({
      setActiveCourseId,
      isActiveCourseLoaded: false,
      isCourseLoaded: (courseId) => courseId === 'javascript',
    });

    const { result } = renderHook(() =>
      useActiveCourseReadiness({ id: 'javascript' }),
    );

    expect(setActiveCourseId).toHaveBeenCalledWith('javascript');
    expect(result.current).toBe(true);
  });
});
