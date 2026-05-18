import { describe, it, expect } from 'vitest';
import { matchesQualityFilters } from './AdminContentQualityTab';

// ─── fixtures ────────────────────────────────────────────────
const PASS = { courseId: 'all', type: 'all', signal: 'all', query: '' };

function makeRow(overrides = {}) {
  return {
    courseId: 'html',
    courseLabel: 'HTML',
    type: 'lesson',
    missing: ['retrievalPrompt', 'transfer'],
    missingLabels: ['Recall prompt', 'Transfer bridge'],
    label: 'HTML - Intro to Tags',
    path: 'html.module-1.lessons[0]',
    moduleTitle: 'Module 1',
    lessonTitle: 'Intro to Tags',
    target: null,
    suggestion: 'Add a recall question.',
    ...overrides,
  };
}

// ─── all-pass baseline ────────────────────────────────────────
describe('matchesQualityFilters — all-pass filters', () => {
  it('returns true when all filters are "all" and query is empty', () => {
    expect(matchesQualityFilters(makeRow(), PASS)).toBe(true);
  });
});

// ─── courseId filter ──────────────────────────────────────────
describe('matchesQualityFilters — courseId', () => {
  it('passes when courseId matches', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, courseId: 'html' })).toBe(true);
  });

  it('rejects when courseId does not match', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, courseId: 'css' })).toBe(false);
  });

  it('passes any courseId when filter is "all"', () => {
    expect(matchesQualityFilters(makeRow({ courseId: 'react' }), { ...PASS, courseId: 'all' })).toBe(true);
  });
});

// ─── type filter ──────────────────────────────────────────────
describe('matchesQualityFilters — type', () => {
  it('passes when type matches', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, type: 'lesson' })).toBe(true);
  });

  it('rejects when type does not match', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, type: 'quiz' })).toBe(false);
  });

  it('uses fallbackType when row.type is absent', () => {
    const row = makeRow({ type: undefined });
    expect(matchesQualityFilters(row, { ...PASS, type: 'lesson' }, 'lesson')).toBe(true);
    expect(matchesQualityFilters(row, { ...PASS, type: 'quiz' }, 'lesson')).toBe(false);
  });
});

// ─── signal filter ────────────────────────────────────────────
describe('matchesQualityFilters — signal', () => {
  it('passes when the signal is in row.missing', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, signal: 'retrievalPrompt' })).toBe(true);
    expect(matchesQualityFilters(makeRow(), { ...PASS, signal: 'transfer' })).toBe(true);
  });

  it('rejects when the signal is not in row.missing', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, signal: 'objective' })).toBe(false);
  });

  it('handles a row with no missing array gracefully', () => {
    expect(matchesQualityFilters(makeRow({ missing: undefined }), { ...PASS, signal: 'transfer' })).toBe(false);
  });
});

// ─── query filter ─────────────────────────────────────────────
describe('matchesQualityFilters — query text search', () => {
  it('passes when query matches lessonTitle (case-insensitive)', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, query: 'intro to tags' })).toBe(true);
    expect(matchesQualityFilters(makeRow(), { ...PASS, query: 'INTRO' })).toBe(true);
  });

  it('passes when query matches moduleTitle', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, query: 'module 1' })).toBe(true);
  });

  it('passes when query matches courseLabel', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, query: 'html' })).toBe(true);
  });

  it('passes when query matches suggestion text', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, query: 'recall' })).toBe(true);
  });

  it('passes when query matches a missingLabel', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, query: 'Transfer bridge' })).toBe(true);
  });

  it('passes when query matches path', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, query: 'module-1' })).toBe(true);
  });

  it('rejects when query matches no searchable field', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, query: 'python' })).toBe(false);
  });

  it('treats a whitespace-only query as empty (matches everything)', () => {
    expect(matchesQualityFilters(makeRow(), { ...PASS, query: '   ' })).toBe(true);
  });
});

// ─── multiple filters combined ────────────────────────────────
describe('matchesQualityFilters — combined filters', () => {
  it('must satisfy all active filters simultaneously', () => {
    const filters = { courseId: 'html', type: 'lesson', signal: 'transfer', query: 'tags' };
    expect(matchesQualityFilters(makeRow(), filters)).toBe(true);
  });

  it('rejects when one of several active filters fails', () => {
    const filters = { courseId: 'html', type: 'lesson', signal: 'transfer', query: 'python' };
    expect(matchesQualityFilters(makeRow(), filters)).toBe(false);
  });
});
