import { useEffect, useRef } from 'react';

function resolveSyncHandlers(syncHandlers) {
  if (typeof syncHandlers === 'function') {
    return {
      markSyncFailed: syncHandlers,
      enqueuePendingSyncWrite: () => false,
    };
  }

  return {
    markSyncFailed: syncHandlers?.markSyncFailed || (() => {}),
    enqueuePendingSyncWrite: syncHandlers?.enqueuePendingSyncWrite || (() => false),
  };
}

export function useFetcherSyncFailure(fetcher, syncHandlers = {}, label = 'fetcher') {
  const lastFailureRef = useRef('');
  const { markSyncFailed, enqueuePendingSyncWrite } = resolveSyncHandlers(syncHandlers);

  useEffect(() => {
    const data = fetcher?.data;
    if (!data || data.ok !== false) return;

    const error = typeof data.error === 'string' && data.error.trim()
      ? data.error.trim()
      : 'Unknown persistence error';
    const recoverableWrite = data.recoverableWrite && typeof data.recoverableWrite === 'object'
      ? data.recoverableWrite
      : null;
    const signature = `${label}:${data.intent || ''}:${error}:${JSON.stringify(recoverableWrite)}`;

    if (lastFailureRef.current === signature) return;
    lastFailureRef.current = signature;

    if (recoverableWrite && enqueuePendingSyncWrite(recoverableWrite, `${label}: ${error}`)) {
      return;
    }

    markSyncFailed(`${label}: ${error}`);
  }, [enqueuePendingSyncWrite, fetcher?.data, label, markSyncFailed]);
}
