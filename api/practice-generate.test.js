import { describe, it, expect } from 'vitest';
import { validateCard, extractJson } from './practice-generate.js';

// ─── validateCard ─────────────────────────────────────────────────────────────

const VALID_CARD = {
  question: 'What does `display: flex` do?',
  options: ['Creates a flex container', 'Hides the element', 'Adds a border', 'Centers text'],
  correct: 0,
  explanation: 'Setting display to flex makes the element a flex container.',
  code: null,
};

describe('validateCard()', () => {
  it('returns a clean card for fully valid input', () => {
    const result = validateCard(VALID_CARD);
    expect(result).not.toBeNull();
    expect(result.question).toBe(VALID_CARD.question);
    expect(result.correct).toBe(0);
    expect(result.options).toHaveLength(4);
    expect(result.code).toBeNull();
  });

  it('returns null for null or non-object input', () => {
    expect(validateCard(null)).toBeNull();
    expect(validateCard('string')).toBeNull();
    expect(validateCard(42)).toBeNull();
  });

  it('returns null when question is "refused" (AI refusal sentinel)', () => {
    expect(validateCard({ ...VALID_CARD, question: 'refused' })).toBeNull();
  });

  it('returns null when question is empty', () => {
    expect(validateCard({ ...VALID_CARD, question: '' })).toBeNull();
    expect(validateCard({ ...VALID_CARD, question: '   ' })).toBeNull();
  });

  it('returns null when question exceeds 240 characters', () => {
    expect(validateCard({ ...VALID_CARD, question: 'q'.repeat(241) })).toBeNull();
  });

  it('returns null when options is not an array of exactly 4', () => {
    expect(validateCard({ ...VALID_CARD, options: ['a', 'b', 'c'] })).toBeNull();
    expect(validateCard({ ...VALID_CARD, options: ['a', 'b', 'c', 'd', 'e'] })).toBeNull();
    expect(validateCard({ ...VALID_CARD, options: null })).toBeNull();
  });

  it('returns null when any option is empty or exceeds 160 characters', () => {
    expect(validateCard({ ...VALID_CARD, options: ['', 'b', 'c', 'd'] })).toBeNull();
    expect(validateCard({
      ...VALID_CARD,
      options: ['a'.repeat(161), 'b', 'c', 'd'],
    })).toBeNull();
  });

  it('returns null when correct index is out of 0–3 range', () => {
    expect(validateCard({ ...VALID_CARD, correct: -1 })).toBeNull();
    expect(validateCard({ ...VALID_CARD, correct: 4 })).toBeNull();
    expect(validateCard({ ...VALID_CARD, correct: 1.5 })).toBeNull();
  });

  it('returns null when explanation is missing or empty', () => {
    expect(validateCard({ ...VALID_CARD, explanation: '' })).toBeNull();
    expect(validateCard({ ...VALID_CARD, explanation: undefined })).toBeNull();
  });

  it('returns null when explanation exceeds 300 characters', () => {
    expect(validateCard({ ...VALID_CARD, explanation: 'e'.repeat(301) })).toBeNull();
  });

  it('trims leading/trailing whitespace from question and explanation', () => {
    const result = validateCard({
      ...VALID_CARD,
      question: '  What is flex?  ',
      explanation: '  It creates a flex container.  ',
    });
    expect(result.question).toBe('What is flex?');
    expect(result.explanation).toBe('It creates a flex container.');
  });

  it('accepts a valid code snippet and passes it through', () => {
    const result = validateCard({ ...VALID_CARD, code: '.box { display: flex; }' });
    expect(result.code).toBe('.box { display: flex; }');
  });

  it('drops code that is empty or exceeds 400 characters', () => {
    expect(validateCard({ ...VALID_CARD, code: '' }).code).toBeNull();
    expect(validateCard({ ...VALID_CARD, code: 'x'.repeat(401) }).code).toBeNull();
  });
});

// ─── extractJson ──────────────────────────────────────────────────────────────

describe('extractJson()', () => {
  it('parses a plain JSON string', () => {
    expect(extractJson('{"key":"value"}')).toEqual({ key: 'value' });
  });

  it('extracts JSON from a ```json ... ``` fence', () => {
    const fenced = '```json\n{"key":"value"}\n```';
    expect(extractJson(fenced)).toEqual({ key: 'value' });
  });

  it('extracts JSON from a plain ``` ... ``` fence (no language tag)', () => {
    const fenced = '```\n{"key":"value"}\n```';
    expect(extractJson(fenced)).toEqual({ key: 'value' });
  });

  it('returns null for invalid JSON', () => {
    expect(extractJson('{not valid json}')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(extractJson(null)).toBeNull();
    expect(extractJson(42)).toBeNull();
    expect(extractJson(undefined)).toBeNull();
  });
});
