import { describe, it, expect } from 'vitest';
import { isAnswerCorrect } from './questionTypes';

// ─── null / undefined answer ──────────────────────────────────
describe('isAnswerCorrect — null/undefined guard', () => {
  it('returns false for undefined answer regardless of question type', () => {
    expect(isAnswerCorrect({ type: 'mc', correct: 'a' }, undefined)).toBe(false);
    expect(isAnswerCorrect({ type: 'fill', correct: 'answer' }, undefined)).toBe(false);
  });

  it('returns false for null answer', () => {
    expect(isAnswerCorrect({ type: 'mc', correct: 'a' }, null)).toBe(false);
  });
});

// ─── mc / code / bug (exact match) ───────────────────────────
describe('isAnswerCorrect — mc / code / bug (exact index match)', () => {
  for (const type of ['mc', 'code', 'bug']) {
    it(`${type}: returns true when answer matches correct`, () => {
      expect(isAnswerCorrect({ type, correct: 'b' }, 'b')).toBe(true);
      expect(isAnswerCorrect({ type, correct: 2 }, 2)).toBe(true);
    });

    it(`${type}: returns false when answer does not match`, () => {
      expect(isAnswerCorrect({ type, correct: 'b' }, 'a')).toBe(false);
      expect(isAnswerCorrect({ type, correct: 2 }, 3)).toBe(false);
    });
  }
});

// ─── fill (tolerant string match) ────────────────────────────
describe('isAnswerCorrect — fill', () => {
  const q = (correct) => ({ type: 'fill', correct });

  it('accepts an exact string match', () => {
    expect(isAnswerCorrect(q('flexbox'), 'flexbox')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isAnswerCorrect(q('flexbox'), 'Flexbox')).toBe(true);
    expect(isAnswerCorrect(q('Flexbox'), 'FLEXBOX')).toBe(true);
  });

  it('trims leading and trailing whitespace', () => {
    expect(isAnswerCorrect(q('flexbox'), '  flexbox  ')).toBe(true);
  });

  it('strips punctuation characters before comparing', () => {
    // Characters stripped: ' " ` ; { } ( )
    expect(isAnswerCorrect(q('display'), '"display"')).toBe(true);
    expect(isAnswerCorrect(q('none'), "'none'")).toBe(true);
    expect(isAnswerCorrect(q('fn'), 'fn()')).toBe(true);
  });

  it('accepts any value from an array of correct answers', () => {
    expect(isAnswerCorrect(q(['block', 'inline-block']), 'block')).toBe(true);
    expect(isAnswerCorrect(q(['block', 'inline-block']), 'inline-block')).toBe(true);
    expect(isAnswerCorrect(q(['block', 'inline-block']), 'flex')).toBe(false);
  });

  it('returns false for an empty or falsy answer', () => {
    expect(isAnswerCorrect(q('flexbox'), '')).toBe(false);
    expect(isAnswerCorrect(q('flexbox'), null)).toBe(false);
  });

  it('returns false when the answer does not match after normalisation', () => {
    expect(isAnswerCorrect(q('flexbox'), 'grid')).toBe(false);
  });

  it('converts numeric answers to string before comparing', () => {
    expect(isAnswerCorrect(q('42'), 42)).toBe(true);
    expect(isAnswerCorrect(q('42'), 43)).toBe(false);
  });
});

// ─── order (array sequence match) ────────────────────────────
describe('isAnswerCorrect — order', () => {
  const q = { type: 'order', correct: ['a', 'b', 'c'] };

  it('returns true when the array is in the correct order', () => {
    expect(isAnswerCorrect(q, ['a', 'b', 'c'])).toBe(true);
  });

  it('returns false when the order is wrong', () => {
    expect(isAnswerCorrect(q, ['b', 'a', 'c'])).toBe(false);
    expect(isAnswerCorrect(q, ['a', 'c', 'b'])).toBe(false);
  });

  it('returns false for a non-array answer', () => {
    expect(isAnswerCorrect(q, 'a,b,c')).toBe(false);
    expect(isAnswerCorrect(q, null)).toBe(false);
  });

  it('returns false for a partial array', () => {
    expect(isAnswerCorrect(q, ['a', 'b'])).toBe(false);
  });
});

// ─── default / unknown type ───────────────────────────────────
describe('isAnswerCorrect — unknown type falls through to exact match', () => {
  it('returns true when answer strictly equals correct', () => {
    expect(isAnswerCorrect({ type: 'custom', correct: 'x' }, 'x')).toBe(true);
  });

  it('returns false when answer does not match', () => {
    expect(isAnswerCorrect({ type: 'custom', correct: 'x' }, 'y')).toBe(false);
  });
});
