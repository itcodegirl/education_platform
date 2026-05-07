export function hasPendingSyncWrites(pendingCount) {
  return Number(pendingCount) > 0;
}

export function buildSkippedRetryResult({ userId, pendingCount = 0, readQueue }) {
  return {
    processed: 0,
    remaining: pendingCount,
    queue: userId && typeof readQueue === 'function' ? readQueue(userId) : [],
    failedItem: null,
    error: null,
  };
}

export function getLocalStorageSyncFailureLabel(detail = {}) {
  const key = typeof detail.key === 'string' && detail.key.trim() ? detail.key : 'unknown-key';
  const phase = typeof detail.phase === 'string' && detail.phase.trim() ? detail.phase : 'unknown';
  return `localStorage ${phase}:${key}`;
}

export function shouldReplayHydratedQueue({
  userId,
  dataLoaded,
  loadError,
  hydratePendingQueue,
  pendingSyncWrites,
  isOnline,
}) {
  return Boolean(
    userId &&
      dataLoaded &&
      !loadError &&
      hydratePendingQueue &&
      hasPendingSyncWrites(pendingSyncWrites) &&
      isOnline,
  );
}
