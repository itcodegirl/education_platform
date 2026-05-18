import { describe, it, expect } from 'vitest';
import { pct, filterRows } from './AdminCoverageTab';

describe('pct', () => {
  it('returns 0 when total is 0', () => {
    expect(pct(5, 0)).toBe(0);
  });

  it('calculates percentage rounded to integer', () => {
    expect(pct(1, 4)).toBe(25);
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it('returns 100 for equal part and total', () => {
    expect(pct(10, 10)).toBe(100);
  });

  it('returns 0 for zero part', () => {
    expect(pct(0, 100)).toBe(0);
  });
});

describe('filterRows', () => {
  const rows = [
    { id: 1, status: 'complete' },
    { id: 2, status: 'needs-review' },
    { id: 3, status: 'missing-assessment' },
    { id: 4, status: 'complete' },
  ];

  it('returns all rows when filter is "all"', () => {
    expect(filterRows(rows, 'all')).toHaveLength(4);
  });

  it('filters to matching status', () => {
    const result = filterRows(rows, 'complete');
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.status === 'complete')).toBe(true);
  });

  it('returns empty array when no rows match', () => {
    expect(filterRows(rows, 'unknown-status')).toHaveLength(0);
  });

  it('handles empty rows array', () => {
    expect(filterRows([], 'all')).toHaveLength(0);
    expect(filterRows([], 'complete')).toHaveLength(0);
  });
});
