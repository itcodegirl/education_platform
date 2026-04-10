import { describe, it, expect } from 'vitest';
import {
  getLevel, getXPInLevel, estimateReadingTime,
  getTodayString, getYesterdayString,
  XP_PER_LEVEL, DAILY_GOAL, XP_VALUES, MILESTONES, TIMING,
} from '../utils/helpers';

describe('getLevel', () => {
  it('returns level 1 at 0 XP', () => {
    expect(getLevel(0)).toBe(1);
  });

  it('returns level 1 at 149 XP', () => {
    expect(getLevel(149)).toBe(1);
  });

  it('returns level 2 at 150 XP', () => {
    expect(getLevel(150)).toBe(2);
  });

  it('returns level 3 at 300 XP', () => {
    expect(getLevel(300)).toBe(3);
  });

  it('handles large XP values', () => {
    expect(getLevel(10000)).toBe(67);
  });
});

describe('getXPInLevel', () => {
  it('returns 0 at level boundary', () => {
    expect(getXPInLevel(0)).toBe(0);
    expect(getXPInLevel(150)).toBe(0);
    expect(getXPInLevel(300)).toBe(0);
  });

  it('returns remainder within level', () => {
    expect(getXPInLevel(75)).toBe(75);
    expect(getXPInLevel(200)).toBe(50);
  });
});

describe('estimateReadingTime', () => {
  it('returns 1 for empty or null input', () => {
    expect(estimateReadingTime('')).toBe(1);
    expect(estimateReadingTime(null)).toBe(1);
    expect(estimateReadingTime(undefined)).toBe(1);
  });

  it('returns 1 for short text', () => {
    expect(estimateReadingTime('Hello world')).toBe(1);
  });

  it('calculates minutes based on 200 wpm', () => {
    const words = Array(400).fill('word').join(' ');
    expect(estimateReadingTime(words)).toBe(2);
  });

  it('rounds up partial minutes', () => {
    const words = Array(250).fill('word').join(' ');
    expect(estimateReadingTime(words)).toBe(2);
  });
});

describe('getTodayString', () => {
  it('returns YYYY-MM-DD format', () => {
    const today = getTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getYesterdayString', () => {
  it('returns YYYY-MM-DD format', () => {
    const yesterday = getYesterdayString();
    expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is one day before today', () => {
    const today = new Date(getTodayString());
    const yesterday = new Date(getYesterdayString());
    const diff = today - yesterday;
    expect(diff).toBe(TIMING.dayMs);
  });
});

describe('constants', () => {
  it('XP_PER_LEVEL is 150', () => {
    expect(XP_PER_LEVEL).toBe(150);
  });

  it('DAILY_GOAL is 3', () => {
    expect(DAILY_GOAL).toBe(3);
  });

  it('XP_VALUES has lesson, quiz, perfectQuiz', () => {
    expect(XP_VALUES.lesson).toBe(25);
    expect(XP_VALUES.quiz).toBe(40);
    expect(XP_VALUES.perfectQuiz).toBe(60);
  });

  it('MILESTONES is sorted ascending', () => {
    for (let i = 1; i < MILESTONES.length; i++) {
      expect(MILESTONES[i]).toBeGreaterThan(MILESTONES[i - 1]);
    }
  });
});
