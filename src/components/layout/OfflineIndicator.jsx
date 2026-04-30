import { useState, useEffect } from 'react';
import { useProgressData } from '../../providers';

const ONLINE_TOAST_DURATION = 3000;

export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const { syncFailed, clearSyncFailed } = useProgressData();

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
        <span className="offline-icon" aria-hidden="true">!</span>
        <span className="offline-text">
          You are offline. You can keep learning, and we will sync your progress automatically when your connection returns.
        </span>
      </div>
    );
  }

  // Priority 2: sync failures (at least one DB write failed silently)
  if (syncFailed > 0) {
    return (
      <div className="offline-banner is-sync-failed" role="alert" aria-live="assertive">
        <span className="offline-icon" aria-hidden="true">!</span>
        <span className="offline-text">
          {syncFailed === 1
            ? 'One progress update could not sync to the cloud yet.'
            : `${syncFailed} progress updates could not sync to the cloud yet.`}
          Your work is still saved on this device.
        </span>
        <button
          type="button"
          className="offline-dismiss"
          onClick={clearSyncFailed}
          aria-label="Dismiss sync warning"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Priority 3: brief "back online" toast after a reconnect
  if (showOnlineToast) {
    return (
      <div className="offline-banner is-online" role="status" aria-live="polite">
        <span className="offline-icon" aria-hidden="true">✓</span>
        <span className="offline-text">Back online. Your progress is syncing now.</span>
      </div>
    );
  }

  return null;
}
