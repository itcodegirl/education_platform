import { describe, it, expect } from 'vitest';
import { getActiveCourseReady } from './useActiveCourseReadiness';

describe('getActiveCourseReady', () => {
  it('returns false with no arguments', () => {
    expect(getActiveCourseReady()).toBe(false);
  });

  it('returns false when isActiveCourseLoaded is false and isCourseLoaded returns false', () => {
    expect(getActiveCourseReady({
      activeCourseMeta: { id: 'html' },
      isActiveCourseLoaded: false,
      isCourseLoaded: () => false,
    })).toBe(false);
  });

  it('returns true when isActiveCourseLoaded is true', () => {
    expect(getActiveCourseReady({ isActiveCourseLoaded: true })).toBe(true);
  });

  it('returns true when isCourseLoaded returns true for the active course id', () => {
    expect(getActiveCourseReady({
      activeCourseMeta: { id: 'html' },
      isActiveCourseLoaded: false,
      isCourseLoaded: (id) => id === 'html',
    })).toBe(true);
  });

  it('returns false when activeCourseMeta has no id', () => {
    expect(getActiveCourseReady({
      activeCourseMeta: {},
      isActiveCourseLoaded: false,
      isCourseLoaded: () => true,
    })).toBe(false);
  });

  it('returns false when activeCourseMeta is null', () => {
    expect(getActiveCourseReady({
      activeCourseMeta: null,
      isActiveCourseLoaded: false,
      isCourseLoaded: () => true,
    })).toBe(false);
  });
});
