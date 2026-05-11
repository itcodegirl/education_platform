/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Module-scoped mocks so we can drive executeProgressWrite +
// replayProgressWriteQueue from individual tests.
const queueState = {
  executeProgressWrite: vi.fn(),
  replayProgressWriteQueue: vi.fn(),
  enqueueProgressWrite: vi.fn(),
  readProgressWriteQueue: vi.fn(),
  createProgressWrite: vi.fn((operation, payload, opts = {}) => ({
    id: 'env-' + Math.random().toString(36).slice(2),
    operation,
    payload,
    label: opts?.label,
  })),
};

vi.mock('../services/progressWriteQueue', () => ({
  executeProgressWrite: (...args) => queueState.executeProgressWrite(...args),
  replayProgressWriteQueue: (...args) => queueState.replayProgressWriteQueue(...args),
  enqueueProgressWrite: (...args) => queueState.enqueueProgressWrite(...args),
  readProgressWriteQueue: (...args) => queueState.readProgressWriteQueue(...args),
  createProgressWrite: (...args) => queueState.createProgressWrite(...args),
}));

vi.mock('../services/progressSyncTelemetry', () => ({
  trackProgressSyncFailure: vi.fn(),
  trackProgressSyncQueued: vi.fn(),
  trackProgressSyncReplay: vi.fn(),
}));

vi.mock('../services/progressWriteRuntime', () => ({
  getProgressWriteFailure: (result) => (result && result.error ? result.error : null),
}));

import { useProgressSync } from './useProgressSync';

beforeEach(() => {
  Object.values(queueState).forEach((fn) => {
    if (typeof fn === 'function' && fn.mockClear) fn.mockClear();
  });
  queueState.readProgressWriteQueue.mockReturnValue([]);
  queueState.enqueueProgressWrite.mockImplementation(() => [{ id: 'queued' }]);
  // Default: writes succeed.
  queueState.executeProgressWrite.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.useRealTimers();
});

const baseProps = {
  userId: 'learner-a',
  dataLoaded: true,
  loadError: null,
  onReloadAfterRetry: vi.fn(),
};

describe('useProgressSync', () => {
  it('dbWrite resolves successfully when execute returns ok', async () => {
    const { result } = renderHook(() => useProgressSync(baseProps));

    let outcome;
    await act(async () => {
      outcome = await result.current.dbWrite({ id: 'w1', operation: 'addLesson' }, 'addLesson');
    });

    expect(outcome).toEqual({ queued: false, skipped: false });
    expect(queueState.executeProgressWrite).toHaveBeenCalledWith('learner-a', { id: 'w1', operation: 'addLesson' });
    expect(result.current.syncFailed).toBe(0);
  });

  it('dbWrite enqueues to retry queue and bumps pendingSyncWrites on failure', async () => {
    queueState.executeProgressWrite.mockResolvedValue({ ok: false, error: new Error('boom') });
    queueState.readProgressWriteQueue.mockReturnValue([{ id: 'queued' }]);

    const { result } = renderHook(() => useProgressSync(baseProps));

    await act(async () => {
      await result.current.dbWrite({ id: 'w1', operation: 'addLesson' }, 'addLesson');
    });

    expect(queueState.enqueueProgressWrite).toHaveBeenCalled();
    expect(result.current.pendingSyncWrites).toBeGreaterThan(0);
  });

  it('skips when there is no userId', async () => {
    const { result } = renderHook(() => useProgressSync({ ...baseProps, userId: '' }));

    let outcome;
    await act(async () => {
      outcome = await result.current.dbWrite({ id: 'w1', operation: 'addLesson' }, 'addLesson');
    });

    expect(outcome).toEqual({ queued: false, skipped: true });
    expect(queueState.executeProgressWrite).not.toHaveBeenCalled();
  });

  it('serializes writes that share the same resourceKey', async () => {
    let firstResolve;
    const firstWriteStarted = new Promise((resolve) => {
      queueState.executeProgressWrite.mockImplementationOnce(() => new Promise((res) => {
        firstResolve = res;
        resolve();
      }));
    });
    let secondStartedAt = 0;
    queueState.executeProgressWrite.mockImplementationOnce(async () => {
      secondStartedAt = Date.now();
      return { ok: true };
    });

    const { result } = renderHook(() => useProgressSync(baseProps));

    let firstPromise;
    let secondPromise;
    await act(async () => {
      firstPromise = result.current.dbWrite({ id: 'A', operation: 'x' }, 'x', { resourceKey: 'k' });
      // Wait long enough for the first write to be in flight.
      await firstWriteStarted;
      secondPromise = result.current.dbWrite({ id: 'B', operation: 'y' }, 'y', { resourceKey: 'k' });
      // The second should still be pending — chain has not advanced.
      const firstFinishedAt = Date.now();
      firstResolve({ ok: true });
      await firstPromise;
      await secondPromise;
      expect(secondStartedAt).toBeGreaterThanOrEqual(firstFinishedAt);
    });

    expect(queueState.executeProgressWrite).toHaveBeenCalledTimes(2);
  });

  it('markSyncFailed bumps the counter; clearSyncFailed resets it', async () => {
    const { result } = renderHook(() => useProgressSync(baseProps));

    await act(async () => {
      result.current.markSyncFailed('manual');
      result.current.markSyncFailed('manual');
    });
    expect(result.current.syncFailed).toBe(2);

    await act(async () => {
      result.current.clearSyncFailed();
    });
    expect(result.current.syncFailed).toBe(0);
  });

  it('retryPendingSyncWrites is a no-op when there is nothing pending', async () => {
    const { result } = renderHook(() => useProgressSync(baseProps));

    let res;
    await act(async () => {
      res = await result.current.retryPendingSyncWrites({ trigger: 'manual' });
    });

    expect(queueState.replayProgressWriteQueue).not.toHaveBeenCalled();
    expect(res).toMatchObject({ processed: 0 });
  });

  it('online event triggers a replay when there are pending writes', async () => {
    // Start unloaded so the session-replay-on-load effect does not
    // auto-consume the queue. We are testing the online listener.
    queueState.readProgressWriteQueue.mockReturnValue([{ id: 'q1' }]);
    queueState.replayProgressWriteQueue.mockResolvedValue({
      processed: 1,
      remaining: 0,
      failedItem: null,
      error: null,
      queue: [],
    });

    const onReloadAfterRetry = vi.fn();
    const { result } = renderHook(() => useProgressSync({
      ...baseProps,
      dataLoaded: false,
      onReloadAfterRetry,
    }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.pendingSyncWrites).toBe(1);

    await act(async () => {
      window.dispatchEvent(new Event('online'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(queueState.replayProgressWriteQueue).toHaveBeenCalledWith('learner-a');
  });

  it('clears pending state when userId becomes empty', async () => {
    queueState.readProgressWriteQueue.mockReturnValue([{ id: 'q1' }, { id: 'q2' }]);

    const { result, rerender } = renderHook(
      ({ userId }) => useProgressSync({ ...baseProps, dataLoaded: false, userId }),
      { initialProps: { userId: 'learner-a' } },
    );

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.pendingSyncWrites).toBe(2);

    queueState.readProgressWriteQueue.mockReturnValue([]);
    rerender({ userId: '' });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.pendingSyncWrites).toBe(0);
  });
});
