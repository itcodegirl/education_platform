import { describe, expect, it } from 'vitest';
import { getReviewLoadSummary } from './reviewLoad';

describe('review load summary', () => {
  it('caps a review burst at five due cards', () => {
    const summary = getReviewLoadSummary({ dueCount: 12, totalCount: 20 });

    expect(summary.tone).toBe('due');
    expect(summary.sessionTarget).toBe(5);
    expect(summary.title).toBe('12 due now');
  });

  it('explains scheduled cards when nothing is due', () => {
    const summary = getReviewLoadSummary({ dueCount: 0, totalCount: 3 });

    expect(summary.tone).toBe('scheduled');
    expect(summary.detail).toMatch(/Let spacing do its job/i);
  });

  it('keeps an empty review queue honest', () => {
    const summary = getReviewLoadSummary();

    expect(summary.tone).toBe('empty');
    expect(summary.title).toBe('No review load yet');
  });
});
