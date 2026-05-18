/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFetcherSyncFailure, resolveSyncHandlers } from './useFetcherSyncFailure';

// --- resolveSyncHandlers ---

describe('resolveSyncHandlers', () => {
  it('wraps a bare function as markSyncFailed with noop enqueue', () => {
    const fn = vi.fn();
    const { markSyncFailed, enqueuePendingSyncWrite } = resolveSyncHandlers(fn);
    expect(markSyncFailed).toBe(fn);
    expect(enqueuePendingSyncWrite()).toBe(false);
  });

  it('extracts markSyncFailed and enqueuePendingSyncWrite from an object', () => {
    const mark = vi.fn();
    const enqueue = vi.fn(() => true);
    const { markSyncFailed, enqueuePendingSyncWrite } = resolveSyncHandlers({ markSyncFailed: mark, enqueuePendingSyncWrite: enqueue });
    expect(markSyncFailed).toBe(mark);
    expect(enqueuePendingSyncWrite).toBe(enqueue);
  });

  it('falls back to noops for missing object fields', () => {
    const { markSyncFailed, enqueuePendingSyncWrite } = resolveSyncHandlers({});
    expect(typeof markSyncFailed).toBe('function');
    expect(enqueuePendingSyncWrite()).toBe(false);
  });

  it('falls back to noops for undefined input', () => {
    const { markSyncFailed, enqueuePendingSyncWrite } = resolveSyncHandlers(undefined);
    expect(typeof markSyncFailed).toBe('function');
    expect(typeof enqueuePendingSyncWrite).toBe('function');
  });
});

// --- useFetcherSyncFailure ---

describe('useFetcherSyncFailure', () => {
  it('does nothing when fetcher has no data', () => {
    const markSyncFailed = vi.fn();
    renderHook(() => useFetcherSyncFailure({}, { markSyncFailed }));
    expect(markSyncFailed).not.toHaveBeenCalled();
  });

  it('does nothing when fetcher.data.ok is true', () => {
    const markSyncFailed = vi.fn();
    renderHook(() => useFetcherSyncFailure({ data: { ok: true } }, { markSyncFailed }));
    expect(markSyncFailed).not.toHaveBeenCalled();
  });

  it('calls markSyncFailed when fetcher.data.ok is false', () => {
    const markSyncFailed = vi.fn();
    renderHook(() => useFetcherSyncFailure(
      { data: { ok: false, error: 'DB write failed' } },
      { markSyncFailed },
      'progress',
    ));
    expect(markSyncFailed).toHaveBeenCalledWith('progress: DB write failed');
  });

  it('uses "Unknown persistence error" when error is missing', () => {
    const markSyncFailed = vi.fn();
    renderHook(() => useFetcherSyncFailure(
      { data: { ok: false } },
      { markSyncFailed },
      'bookmark',
    ));
    expect(markSyncFailed).toHaveBeenCalledWith('bookmark: Unknown persistence error');
  });

  it('uses "Unknown persistence error" when error is whitespace only', () => {
    const markSyncFailed = vi.fn();
    renderHook(() => useFetcherSyncFailure(
      { data: { ok: false, error: '   ' } },
      { markSyncFailed },
      'test',
    ));
    expect(markSyncFailed).toHaveBeenCalledWith('test: Unknown persistence error');
  });

  it('does not call markSyncFailed when recoverableWrite is enqueued', () => {
    const markSyncFailed = vi.fn();
    const enqueuePendingSyncWrite = vi.fn(() => true);
    const recoverableWrite = { type: 'updateStreak', payload: {} };
    renderHook(() => useFetcherSyncFailure(
      { data: { ok: false, error: 'failed', recoverableWrite } },
      { markSyncFailed, enqueuePendingSyncWrite },
      'streak',
    ));
    expect(enqueuePendingSyncWrite).toHaveBeenCalledWith(recoverableWrite, 'streak: failed');
    expect(markSyncFailed).not.toHaveBeenCalled();
  });

  it('calls markSyncFailed when enqueue returns false', () => {
    const markSyncFailed = vi.fn();
    const enqueuePendingSyncWrite = vi.fn(() => false);
    const recoverableWrite = { type: 'updateStreak', payload: {} };
    renderHook(() => useFetcherSyncFailure(
      { data: { ok: false, error: 'failed', recoverableWrite } },
      { markSyncFailed, enqueuePendingSyncWrite },
    ));
    expect(markSyncFailed).toHaveBeenCalled();
  });

  it('deduplicates: same failure signature does not re-trigger on re-render', () => {
    const markSyncFailed = vi.fn();
    const data = { ok: false, error: 'Same error' };
    const { rerender } = renderHook(
      ({ fetcher }) => useFetcherSyncFailure(fetcher, { markSyncFailed }),
      { initialProps: { fetcher: { data } } },
    );
    rerender({ fetcher: { data } });
    expect(markSyncFailed).toHaveBeenCalledTimes(1);
  });
});
