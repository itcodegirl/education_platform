/* @vitest-environment jsdom */

import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReviewQueue } from './useReviewQueue';

const user = { id: 'learner-a' };

function fakeCard(question, overrides = {}) {
  return {
    question,
    code: '',
    options: ['a', 'b'],
    correct: 0,
    explanation: 'because',
    source: 'lesson',
    added: 0,
    nextReview: 0,
    interval: 1,
    ease: 2.5,
    ...overrides,
  };
}

const createProgressWrite = vi.fn((operation, payload) => ({ id: 'envelope', operation, payload }));

describe('useReviewQueue', () => {
  it('appends new cards and skips duplicates by question', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useReviewQueue({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.addToSRQueue([fakeCard('Q1'), fakeCard('Q2')]);
    });
    expect(result.current.srCards.map((c) => c.question)).toEqual(['Q1', 'Q2']);

    await act(async () => {
      await result.current.addToSRQueue([fakeCard('Q1'), fakeCard('Q3')]);
    });
    expect(result.current.srCards.map((c) => c.question)).toEqual(['Q1', 'Q2', 'Q3']);
    // dbWrite called once per *new* card across both calls = 3 total
    expect(dbWrite).toHaveBeenCalledTimes(3);
  });

  it('refuses writes when user is null', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useReviewQueue({ user: null, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.addToSRQueue([fakeCard('Q1')]);
    });
    expect(result.current.srCards).toEqual([]);
    expect(dbWrite).not.toHaveBeenCalled();
  });

  it('updateSRCard advances the schedule and serializes per-question writes', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useReviewQueue({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.addToSRQueue([fakeCard('Q1', { interval: 1, ease: 2.5 })]);
    });
    dbWrite.mockClear();

    await act(async () => {
      await result.current.updateSRCard('Q1', true);
    });

    expect(dbWrite).toHaveBeenCalledTimes(1);
    const [, label, options] = dbWrite.mock.calls[0];
    expect(label).toBe('updateSRCard');
    expect(options).toEqual({ resourceKey: 'sr-card:Q1' });
  });

  it('updateSRCard is a no-op for an unknown question', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useReviewQueue({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      await result.current.updateSRCard('Q1', true);
    });

    expect(dbWrite).not.toHaveBeenCalled();
    expect(result.current.srCards).toEqual([]);
  });

  it('getDueSRCards returns only cards with nextReview <= now', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useReviewQueue({ user, dbWrite, createProgressWrite }));

    const now = Date.now();
    await act(async () => {
      result.current.replaceCards([
        fakeCard('past', { nextReview: now - 1000 }),
        fakeCard('now', { nextReview: now }),
        fakeCard('future', { nextReview: now + 60_000 }),
      ]);
    });

    const due = result.current.getDueSRCards();
    expect(due.map((c) => c.question)).toEqual(['past', 'now']);
  });

  it('replaceCards seeds the list and resetCards clears it', async () => {
    const dbWrite = vi.fn();
    const { result } = renderHook(() => useReviewQueue({ user, dbWrite, createProgressWrite }));

    await act(async () => {
      result.current.replaceCards([fakeCard('A'), fakeCard('B')]);
    });
    expect(result.current.srCards).toHaveLength(2);

    await act(async () => {
      result.current.resetCards();
    });
    expect(result.current.srCards).toEqual([]);
  });
});
