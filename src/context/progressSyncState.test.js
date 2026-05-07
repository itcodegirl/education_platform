import { describe, expect, it } from 'vitest';
import {
  buildSkippedRetryResult,
  getLocalStorageSyncFailureLabel,
  hasPendingSyncWrites,
  shouldReplayHydratedQueue,
} from './progressSyncState';

describe('progress sync state helpers', () => {
  it('normalizes pending-write counts', () => {
    expect(hasPendingSyncWrites(0)).toBe(false);
    expect(hasPendingSyncWrites('0')).toBe(false);
    expect(hasPendingSyncWrites(2)).toBe(true);
  });

  it('builds a stable no-op retry result without requiring a user id', () => {
    expect(buildSkippedRetryResult({ userId: '', pendingCount: 3, readQueue: () => ['write'] })).toEqual({
      processed: 0,
      remaining: 3,
      queue: [],
      failedItem: null,
      error: null,
    });
  });

  it('keeps localStorage failure labels human-debuggable without trusting event shape', () => {
    expect(getLocalStorageSyncFailureLabel({ key: 'chw-tasks', phase: 'write' })).toBe(
      'localStorage write:chw-tasks',
    );
    expect(getLocalStorageSyncFailureLabel({})).toBe('localStorage unknown:unknown-key');
  });

  it('only replays hydrated queues after user data is loaded and the browser is online', () => {
    expect(shouldReplayHydratedQueue({
      userId: 'uid',
      dataLoaded: true,
      loadError: null,
      hydratePendingQueue: true,
      pendingSyncWrites: 1,
      isOnline: true,
    })).toBe(true);

    expect(shouldReplayHydratedQueue({
      userId: 'uid',
      dataLoaded: true,
      loadError: null,
      hydratePendingQueue: true,
      pendingSyncWrites: 1,
      isOnline: false,
    })).toBe(false);
  });
});
