import { useEffect, useRef } from 'react';

export function useFetcherSyncFailure(fetcher, markSyncFailed = () => {}, label = 'fetcher') {
  const lastFailureRef = useRef('');

  useEffect(() => {
    const data = fetcher?.data;
    if (!data || data.ok !== false) return;

    const error = typeof data.error === 'string' && data.error.trim()
      ? data.error.trim()
      : 'Unknown persistence error';
    const signature = `${label}:${data.intent || ''}:${error}`;

    if (lastFailureRef.current === signature) return;
    lastFailureRef.current = signature;
    markSyncFailed(`${label}: ${error}`);
  }, [fetcher?.data, label, markSyncFailed]);
}
