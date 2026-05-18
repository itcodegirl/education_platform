/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReviewQueue } from './useReviewQueue';

function makeHandlers(user = { id: 'u1' }) {
  return {
    user,
    dbWrite: vi.fn(),
    createProgressWrite: vi.fn((type, payload) => ({ type, payload })),
  };
}

function makeCard(question, nextReview = Date.now() + 86400000) {
  return { question, options: ['a', 'b'], correct: 0, explanation: '', nextReview, interval: 1, ease: 2.5 };
}

describe('useReviewQueue initial state', () => {
  it('starts with empty srCards', () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers()));
    expect(result.current.srCards).toEqual([]);
  });
});

describe('replaceCards', () => {
  it('replaces the card list', () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers()));
    const cards = [makeCard('What is a div?')];
    act(() => { result.current.replaceCards(cards); });
    expect(result.current.srCards).toEqual(cards);
  });

  it('resets to empty array for non-array input', () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers()));
    act(() => { result.current.replaceCards(null); });
    expect(result.current.srCards).toEqual([]);
  });
});

describe('resetCards', () => {
  it('clears all cards', () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers()));
    act(() => { result.current.replaceCards([makeCard('q1')]); });
    act(() => { result.current.resetCards(); });
    expect(result.current.srCards).toEqual([]);
  });
});

describe('addToSRQueue', () => {
  it('does nothing when user is null', async () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers(null)));
    await act(() => result.current.addToSRQueue([makeCard('q1')]));
    expect(result.current.srCards).toEqual([]);
  });

  it('does nothing for empty array', async () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers()));
    await act(() => result.current.addToSRQueue([]));
    expect(result.current.srCards).toEqual([]);
  });

  it('appends new cards', async () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers()));
    await act(() => result.current.addToSRQueue([makeCard('q1'), makeCard('q2')]));
    expect(result.current.srCards).toHaveLength(2);
  });

  it('deduplicates on question field', async () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers()));
    await act(() => result.current.addToSRQueue([makeCard('q1')]));
    await act(() => result.current.addToSRQueue([makeCard('q1'), makeCard('q2')]));
    expect(result.current.srCards).toHaveLength(2);
  });

  it('calls dbWrite for each new card', async () => {
    const handlers = makeHandlers();
    const { result } = renderHook(() => useReviewQueue(handlers));
    await act(() => result.current.addToSRQueue([makeCard('q1'), makeCard('q2')]));
    expect(handlers.dbWrite).toHaveBeenCalledTimes(2);
  });
});

describe('getDueSRCards', () => {
  it('returns empty when no cards are due', () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers()));
    act(() => { result.current.replaceCards([makeCard('future', Date.now() + 999999)]); });
    expect(result.current.getDueSRCards()).toHaveLength(0);
  });

  it('returns cards with nextReview <= now', () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers()));
    act(() => { result.current.replaceCards([makeCard('past', Date.now() - 1000)]); });
    expect(result.current.getDueSRCards()).toHaveLength(1);
  });
});

describe('updateSRCard', () => {
  it('does nothing when user is null', async () => {
    const { result } = renderHook(() => useReviewQueue(makeHandlers(null)));
    act(() => { result.current.replaceCards([makeCard('q1')]); });
    await act(() => result.current.updateSRCard('q1', true));
    expect(result.current.srCards[0].ease).toBe(2.5);
  });

  it('does nothing when card is not found', async () => {
    const handlers = makeHandlers();
    const { result } = renderHook(() => useReviewQueue(handlers));
    await act(() => result.current.updateSRCard('nonexistent', true));
    expect(handlers.dbWrite).not.toHaveBeenCalled();
  });

  it('updates the card after correct answer', async () => {
    const handlers = makeHandlers();
    const { result } = renderHook(() => useReviewQueue(handlers));
    act(() => { result.current.replaceCards([makeCard('q1')]); });
    await act(() => result.current.updateSRCard('q1', true));
    expect(handlers.dbWrite).toHaveBeenCalled();
  });
});
