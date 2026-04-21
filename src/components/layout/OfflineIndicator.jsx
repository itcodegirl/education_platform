// ═══════════════════════════════════════════════
// OFFLINE INDICATOR — Connection + sync status banner
//
// Shows three states, in order of priority:
//   1. OFFLINE            — no internet connection
//   2. SYNC FAILED        — writes to Supabase have failed silently
//                           (local state is intact, but the cloud
//                           copy is stale). Surfaces the new
//                           syncFailed counter from ProgressContext
//                           so users notice before losing work.
//   3. BACK ONLINE        — brief confirmation after reconnect
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useProgressData } from '../../providers';

const ONLINE_TOAST_DURATION = 3000;

export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const { syncFailed, clearSyncFailed, retryLoad } = useProgressData();

  useEffect(() => {
    let timer;
    const handleOffline = () => {
      setOffline(true);
      setShowOnlineToast(false);
    };
    const handleOnline = () => {
      setOffline(false);
      setShowOnlineToast(true);
      timer = setTimeout(() => setShowOnlineToast(false), ONLINE_TOAST_DURATION);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Priority 1: offline
  if (offline) {
    return (
      <div className="offline-banner is-offline" role="status" aria-live="polite">
        <span className="offline-icon" aria-hidden="true">📡</span>
        <span className="offline-text">
          You&apos;re offline — lessons are available from cache. Progress will sync when you reconnect.
        </span>
      </div>
    );
  }

  // Priority 2: sync failures (at least one DB write failed silently)
  if (syncFailed > 0) {
    return (
      <div className="offline-banner is-sync-failed" role="alert" aria-live="assertive">
        <span className="offline-icon" aria-hidden="true">⚠️</span>
        <span className="offline-text">
          {syncFailed === 1
            ? 'A progress update could not sync to the cloud.'
            : `${syncFailed} progress updates could not sync to the cloud.`}
          {' '}Your work is still saved locally.
        </span>
        <button
          type="button"
          className="offline-retry"
          onClick={() => { retryLoad(); }}
          aria-label="Retry syncing to the cloud"
        >
          Retry
        </button>
        <button
          type="button"
          className="offline-dismiss"
          onClick={clearSyncFailed}
          aria-label="Dismiss sync warning"
        >
          ✕
        </button>
      </div>
    );
  }

  // Priority 3: brief "back online" toast after a reconnect
  if (showOnlineToast) {
    return (
      <div className="offline-banner is-online" role="status" aria-live="polite">
        <span className="offline-icon" aria-hidden="true">✓</span>
        <span className="offline-text">Back online — syncing your progress.</span>
      </div>
    );
  }

  return null;
}
