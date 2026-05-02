import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  XP_PER_LEVEL,
  XP_VALUES,
  DAILY_GOAL,
  MILESTONES,
  estimateReadingTime,
  getActiveStreakDays,
  getLevel,
  getTodayString,
  getXPInLevel,
  getYesterdayString,
} from './helpers';

afterEach(() => {
  vi.useRealTimers();
});

describe('XP constants', () => {
  it('keeps the documented progression scale stable', () => {
    expect(XP_PER_LEVEL).toBe(150);
    expect(DAILY_GOAL).toBe(3);
    expect(XP_VALUES).toEqual({ lesson: 25, quiz: 40, perfectQuiz: 60, challenge: 25 });
    expect(MILESTONES).toEqual([5, 10, 25, 50, 75, 92]);
  });
});

describe('getLevel', () => {
  it('starts at level 1 with no XP', () => {
    expect(getLevel(0)).toBe(1);
  });

  it('stays on level 1 until the threshold', () => {
    expect(getLevel(149)).toBe(1);
  });

  it('promotes exactly at the threshold', () => {
    expect(getLevel(XP_PER_LEVEL)).toBe(2);
    expect(getLevel(XP_PER_LEVEL * 2)).toBe(3);
  });

  it('handles large XP values', () => {
    expect(getLevel(XP_PER_LEVEL * 99 + 50)).toBe(100);
  });
});

describe('getXPInLevel', () => {
  it('returns the remainder XP within the current level', () => {
    expect(getXPInLevel(0)).toBe(0);
    expect(getXPInLevel(50)).toBe(50);
    expect(getXPInLevel(XP_PER_LEVEL)).toBe(0);
    expect(getXPInLevel(XP_PER_LEVEL + 25)).toBe(25);
  });
});

describe('estimateReadingTime', () => {
  it('returns 1 minute for missing or empty text', () => {
    expect(estimateReadingTime('')).toBe(1);
    expect(estimateReadingTime(null)).toBe(1);
    expect(estimateReadingTime(undefined)).toBe(1);
  });

  it('rounds up at 200 words/minute', () => {
    const oneHundredWords = Array(100).fill('word').join(' ');
    expect(estimateReadingTime(oneHundredWords)).toBe(1);
    const fourHundredWords = Array(400).fill('word').join(' ');
    expect(estimateReadingTime(fourHundredWords)).toBe(2);
    const fiveHundredWords = Array(500).fill('word').join(' ');
    expect(estimateReadingTime(fiveHundredWords)).toBe(3);
  });

  it('always returns at least 1 minute even for one-word input', () => {
    expect(estimateReadingTime('hi')).toBe(1);
  });
});

describe('getTodayString / getYesterdayString', () => {
  it('returns YYYY-MM-DD UTC strings', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-14T12:00:00.000Z'));
    expect(getTodayString()).toBe('2025-03-14');
    expect(getYesterdayString()).toBe('2025-03-13');
  });

  it('rolls back across a month boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-04-01T05:00:00.000Z'));
    expect(getTodayString()).toBe('2025-04-01');
    expect(getYesterdayString()).toBe('2025-03-31');
  });

  it('rolls back across a year boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:30:00.000Z'));
    expect(getTodayString()).toBe('2026-01-01');
    expect(getYesterdayString()).toBe('2025-12-31');
  });
});

describe('getActiveStreakDays', () => {
  const today = '2025-05-10';
  const yesterday = '2025-05-09';

  it('returns the saved streak when the learner was active today', () => {
    expect(getActiveStreakDays(7, today, today, yesterday)).toBe(7);
  });

  it('returns the saved streak when the learner was active yesterday', () => {
    expect(getActiveStreakDays(7, yesterday, today, yesterday)).toBe(7);
  });

  it('returns 0 when last activity is older than yesterday', () => {
    expect(getActiveStreakDays(7, '2025-05-07', today, yesterday)).toBe(0);
  });

  it('returns 0 when there is no recorded last date', () => {
    expect(getActiveStreakDays(7, '', today, yesterday)).toBe(0);
    expect(getActiveStreakDays(7, null, today, yesterday)).toBe(0);
    expect(getActiveStreakDays(7, undefined, today, yesterday)).toBe(0);
  });

  it('returns 0 for non-positive or non-finite stored counts', () => {
    expect(getActiveStreakDays(0, today, today, yesterday)).toBe(0);
    expect(getActiveStreakDays(-3, today, today, yesterday)).toBe(0);
    expect(getActiveStreakDays(Number.NaN, today, today, yesterday)).toBe(0);
    expect(getActiveStreakDays(Infinity, today, today, yesterday)).toBe(0);
  });
});
