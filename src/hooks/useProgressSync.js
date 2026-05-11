// useProgressSync — owns the cloud-write retry surface for the
// active learner's progress. Extracted from ProgressContext.jsx so
// the provider only orchestrates state + lifecycle, not the queue.
//
// Responsibilities:
//   - Maintain syncFailed / pendingSyncWrites / syncRetryInFlight
//     UI state and the matching refs that survive re-renders.
//   - Provide dbWrite — the optimistic-friendly Supabase write
//     wrapper with optional per-resource serialization.
//   - Provide enqueuePendingSyncWrite — append a write envelope to
//     the local retry queue when the network call fails.
//   - Provide retryPendingSyncWrites — replay the queue, with an
//     optional onReloadAfterRetry callback for the data layer.
//   - Listen for the `online` event and the local-storage failure
//     event, and replay the queue on session resume.
//
// The hook intentionally does NOT manage data state (completed,
// quizScores, xp, etc.) — those stay in ProgressContext. This is
// the first concrete extraction toward the full file split planned
// in docs/progress-context-split-plan.md.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createProgressWrite,
  enqueueProgressWrite,
  executeProgressWrite,
  readProgressWriteQueue,
  replayProgressWriteQueue,
} from '../services/progressWriteQueue';
import {
  trackProgressSyncFailure,
  trackProgressSyncQueued,
  trackProgressSyncReplay,
} from '../services/progressSyncTelemetry';
import { getProgressWriteFailure } from '../services/progressWriteRuntime';
import {
  buildSkippedRetryResult,
  getLocalStorageSyncFailureLabel,
  hasPendingSyncWrites,
  shouldReplayHydratedQueue,
} from '../context/progressSyncState';
import { LOCAL_STORAGE_SYNC_ERROR_EVENT } from './useLocalStorage';

export function useProgressSync({ userId, dataLoaded, loadError, onReloadAfterRetry }) {
  const [syncFailed, setSyncFailed] = useState(0);
  const [pendingSyncWrites, setPendingSyncWrites] = useState(0);
  const [syncRetryInFlight, setSyncRetryInFlight] = useState(false);
  const pendingSyncWritesRef = useRef(0);
  const hydratePendingQueueRef = useRef(false);
  // Per-resource write chain map. Writes that share a resourceKey
  // are serialized so a rapid toggle (addLesson → removeLesson →
  // addLesson on the same lessonKey) lands in submit order on the
  // server. Writes with different resourceKeys still run in parallel.
  const writeChainsRef = useRef(new Map());

  const markSyncFailed = useCallback((label = 'sync-write') => {
    trackProgressSyncFailure({
      label,
      pendingCount: pendingSyncWritesRef.current,
    });
    setSyncFailed((count) => count + 1);
  }, []);

  const clearSyncFailed = useCallback(() => setSyncFailed(0), []);

  const syncPendingQueueCount = useCallback((targetUserId = userId) => {
    if (!targetUserId) {
      pendingSyncWritesRef.current = 0;
      setPendingSyncWrites(0);
      return 0;
    }

    const queueCount = readProgressWriteQueue(targetUserId).length;
    pendingSyncWritesRef.current = queueCount;
    setPendingSyncWrites(queueCount);
    return queueCount;
  }, [userId]);

  const enqueuePendingSyncWrite = useCallback((writeLike, label = 'sync-write') => {
    if (!userId || !writeLike?.operation) return false;

    try {
      const queueItem = writeLike.id
        ? writeLike
        : createProgressWrite(writeLike.operation, writeLike.payload, { label });

      const queue = enqueueProgressWrite(userId, queueItem);
      trackProgressSyncQueued({
        operation: queueItem.operation,
        label: queueItem.label,
        queueSize: queue.length,
      });
      hydratePendingQueueRef.current = false;
      syncPendingQueueCount(userId);
      return true;
    } catch (queueErr) {
      if (import.meta.env.DEV) {
        console.warn(
          `[useProgressSync] ${label} could not be added to the retry queue:`,
          queueErr,
        );
      }
      markSyncFailed(label);
      return false;
    }
  }, [markSyncFailed, syncPendingQueueCount, userId]);

  // Reset chains when the active learner changes — a chain captured
  // the old userId and would otherwise resolve a write against a
  // stale identity.
  useEffect(() => {
    writeChainsRef.current = new Map();
  }, [userId]);

  // Supabase write helper. Optimistic state is updated BEFORE this
  // is called, so we catch and report failures rather than rollback.
  // The optional resourceKey serializes concurrent writes against
  // the same resource without blocking writes against unrelated
  // resources.
  const dbWrite = useCallback(async (write, label = 'db-write', options = {}) => {
    if (!userId) return { queued: false, skipped: true };

    const performWrite = async () => {
      try {
        const result = await executeProgressWrite(userId, write);
        const failure = getProgressWriteFailure(result);
        if (failure) throw failure;
        return { queued: false, skipped: false };
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(
            `[useProgressSync] ${label} failed — optimistic state kept:`,
            err,
          );
        }
        const queued = enqueuePendingSyncWrite(write, label);
        return { queued, skipped: false };
      }
    };

    const resourceKey = options?.resourceKey;
    if (!resourceKey) {
      return performWrite();
    }

    const chains = writeChainsRef.current;
    const previous = chains.get(resourceKey) || Promise.resolve();
    const next = previous.catch(() => {}).then(performWrite);
    chains.set(resourceKey, next);
    next.finally(() => {
      if (chains.get(resourceKey) === next) {
        chains.delete(resourceKey);
      }
    });
    return next;
  }, [enqueuePendingSyncWrite, userId]);

  const retryPendingSyncWrites = useCallback(async ({
    reloadAfterSuccess = false,
    trigger = 'manual',
  } = {}) => {
    if (!userId || syncRetryInFlight || !hasPendingSyncWrites(pendingSyncWritesRef.current)) {
      return buildSkippedRetryResult({
        userId,
        pendingCount: pendingSyncWritesRef.current,
        readQueue: readProgressWriteQueue,
      });
    }

    setSyncRetryInFlight(true);
    try {
      const result = await replayProgressWriteQueue(userId);
      pendingSyncWritesRef.current = result.remaining;
      setPendingSyncWrites(result.remaining);
      trackProgressSyncReplay({
        trigger,
        processed: result.processed,
        remaining: result.remaining,
        failedItem: result.failedItem,
        error: result.error,
      });

      if (result.error) {
        markSyncFailed('retryPendingSyncWrites');
      } else if (result.remaining === 0) {
        hydratePendingQueueRef.current = false;
        if (reloadAfterSuccess && typeof onReloadAfterRetry === 'function') {
          onReloadAfterRetry();
        }
      }

      return result;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[useProgressSync] retryPendingSyncWrites failed:', err);
      }
      trackProgressSyncReplay({
        trigger,
        processed: 0,
        remaining: pendingSyncWritesRef.current,
        error: err,
      });
      markSyncFailed('retryPendingSyncWrites');
      return {
        processed: 0,
        remaining: pendingSyncWritesRef.current,
        queue: readProgressWriteQueue(userId),
        failedItem: null,
        error: err,
      };
    } finally {
      setSyncRetryInFlight(false);
    }
  }, [markSyncFailed, onReloadAfterRetry, syncRetryInFlight, userId]);

  // Surface localStorage write failures as sync failures so the
  // banner counts them along with cloud-write failures.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleLocalStorageFailure = (event) => {
      markSyncFailed(getLocalStorageSyncFailureLabel(event.detail));
    };

    window.addEventListener(LOCAL_STORAGE_SYNC_ERROR_EVENT, handleLocalStorageFailure);
    return () => window.removeEventListener(LOCAL_STORAGE_SYNC_ERROR_EVENT, handleLocalStorageFailure);
  }, [markSyncFailed]);

  // Sync the queue counter when the active learner changes.
  useEffect(() => {
    if (!userId) {
      hydratePendingQueueRef.current = false;
      pendingSyncWritesRef.current = 0;
      setPendingSyncWrites(0);
      setSyncRetryInFlight(false);
      return;
    }

    const queueCount = syncPendingQueueCount(userId);
    hydratePendingQueueRef.current = queueCount > 0;
  }, [syncPendingQueueCount, userId]);

  // Replay the queue when the browser reports it is back online.
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return undefined;

    const handleOnline = () => {
      if (hasPendingSyncWrites(pendingSyncWritesRef.current)) {
        retryPendingSyncWrites({ trigger: 'online' });
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [retryPendingSyncWrites, userId]);

  // Replay the queue on session resume once data has loaded.
  useEffect(() => {
    const isOnline = typeof navigator === 'undefined' || navigator.onLine;
    const shouldReplay = shouldReplayHydratedQueue({
      userId,
      dataLoaded,
      loadError,
      hydratePendingQueue: hydratePendingQueueRef.current,
      pendingSyncWrites,
      isOnline,
    });

    if (!shouldReplay) return;

    hydratePendingQueueRef.current = false;
    retryPendingSyncWrites({ reloadAfterSuccess: true, trigger: 'session-replay' });
  }, [dataLoaded, loadError, pendingSyncWrites, retryPendingSyncWrites, userId]);

  return {
    syncFailed,
    pendingSyncWrites,
    syncRetryInFlight,
    markSyncFailed,
    clearSyncFailed,
    enqueuePendingSyncWrite,
    dbWrite,
    retryPendingSyncWrites,
    setSyncFailed,
  };
}
