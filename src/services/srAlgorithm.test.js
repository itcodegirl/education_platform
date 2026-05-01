import { describe, it, expect } from 'vitest';
import { nextSRCardState } from './srAlgorithm';
import { TIMING } from '../utils/helpers';

const FIXED_NOW = new Date('2026-04-30T12:00:00Z').getTime();

const baseCard = {
  question: 'What does <h1> do?',
  interval: 4,
  ease: 2.3,
};

describe('nextSRCardState', () => {
  describe('correct answers', () => {
    it('grows interval by the BEFORE-update ease (SM-2 convention)', () => {
      const next = nextSRCardState({ card: baseCard, correct: true, now: FIXED_NOW });
      // 4 * 2.3 = 9.2 -> rounded to 9
      expect(next.interval).toBe(9);
    });

    it('bumps ease by 0.1 on a correct answer', () => {
      const next = nextSRCardState({ card: baseCard, correct: true, now: FIXED_NOW });
      expect(next.ease).toBeCloseTo(2.4, 5);
    });

    it('caps ease at 3.0 even after many correct answers', () => {
      const next = nextSRCardState({ card: { ...baseCard, ease: 2.95 }, correct: true, now: FIXED_NOW });
      expect(next.ease).toBe(3.0);
    });

    it('schedules nextReview by interval days from now', () => {
      const next = nextSRCardState({ card: baseCard, correct: true, now: FIXED_NOW });
      // interval = 9 (from above), so nextReview = now + 9 * dayMs
      expect(next.nextReview).toBe(FIXED_NOW + 9 * TIMING.dayMs);
    });
  });

  describe('wrong answers', () => {
    it('resets interval to 1 day regardless of the prior interval', () => {
      const next = nextSRCardState({ card: { ...baseCard, interval: 50 }, correct: false, now: FIXED_NOW });
      expect(next.interval).toBe(1);
    });

    it('drops ease by 0.2 on a wrong answer', () => {
      const next = nextSRCardState({ card: baseCard, correct: false, now: FIXED_NOW });
      expect(next.ease).toBeCloseTo(2.1, 5);
    });

    it('floors ease at 1.3 even after many wrong answers', () => {
      const next = nextSRCardState({ card: { ...baseCard, ease: 1.4 }, correct: false, now: FIXED_NOW });
      expect(next.ease).toBe(1.3);
    });

    it('schedules nextReview for tomorrow', () => {
      const next = nextSRCardState({ card: baseCard, correct: false, now: FIXED_NOW });
      expect(next.nextReview).toBe(FIXED_NOW + 1 * TIMING.dayMs);
    });
  });

  describe('clamping edge cases', () => {
    it('a correct answer at ease 3.0 stays at 3.0 (cap, not overshoot)', () => {
      const next = nextSRCardState({ card: { ...baseCard, ease: 3.0 }, correct: true, now: FIXED_NOW });
      expect(next.ease).toBe(3.0);
    });

    it('a wrong answer at ease 1.3 stays at 1.3 (floor, not undershoot)', () => {
      const next = nextSRCardState({ card: { ...baseCard, ease: 1.3 }, correct: false, now: FIXED_NOW });
      expect(next.ease).toBe(1.3);
    });
  });

  describe('full lifecycle', () => {
    it('a correct streak grows interval geometrically', () => {
      let card = { ...baseCard, interval: 1, ease: 2.5 };
      const intervals = [];
      for (let i = 0; i < 4; i += 1) {
        const next = nextSRCardState({ card, correct: true, now: FIXED_NOW });
        intervals.push(next.interval);
        card = { ...card, interval: next.interval, ease: next.ease };
      }
      // Each step grows by the ease-at-time-of-answer; the sequence
      // should be strictly increasing.
      for (let i = 1; i < intervals.length; i += 1) {
        expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
      }
    });

    it('a wrong answer always brings the card back to a 1-day review', () => {
      let card = { ...baseCard, interval: 30, ease: 2.8 };
      const next = nextSRCardState({ card, correct: false, now: FIXED_NOW });
      card = { ...card, ...next };
      expect(card.interval).toBe(1);
      expect(card.nextReview).toBe(FIXED_NOW + TIMING.dayMs);
    });
  });

  it('uses Date.now() when no `now` is passed', () => {
    const before = Date.now();
    const next = nextSRCardState({ card: baseCard, correct: true });
    const after = Date.now();
    // nextReview = nowDefault + interval * dayMs, so subtract back
    // and check the implied "now" is between our before/after sample.
    const impliedNow = next.nextReview - next.interval * TIMING.dayMs;
    expect(impliedNow).toBeGreaterThanOrEqual(before);
    expect(impliedNow).toBeLessThanOrEqual(after);
  });
});
