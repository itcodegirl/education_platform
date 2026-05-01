import { useEffect, useRef, useState } from 'react';
import { useProgressData } from '../../providers';

const ONLINE_TOAST_DURATION = 3000;

function getInitialOfflineState() {
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}

export function OfflineIndicator() {
  const [offline, setOffline] = useState(getInitialOfflineState);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const {
    syncFailed,
    pendingSyncWrites,
    syncRetryInFlight,
    clearSyncFailed,
    retryPendingSyncWrites,
  } = useProgressData();
  const onlineToastTimerRef = useRef(null);

  useEffect(() => {
    const clearOnlineToastTimer = () => {
      if (onlineToastTimerRef.current) {
        clearTimeout(onlineToastTimerRef.current);
        onlineToastTimerRef.current = null;
      }
    };

    const handleOffline = () => {
      clearOnlineToastTimer();
      setOffline(true);
      setShowOnlineToast(false);
    };

    const handleOnline = () => {
      setOffline(false);
      setShowOnlineToast(true);
      clearOnlineToastTimer();
      onlineToastTimerRef.current = setTimeout(() => {
        setShowOnlineToast(false);
        onlineToastTimerRef.current = null;
      }, ONLINE_TOAST_DURATION);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      clearOnlineToastTimer();
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (offline) {
    return (
      <div className="offline-banner is-offline" role="status" aria-live="polite" aria-atomic="true">
        <span className="offline-icon" aria-hidden="true">!</span>
        <span className="offline-text">
          {pendingSyncWrites > 0
            ? pendingSyncWrites === 1
              ? 'You are offline. One progress update is queued in this browser and will retry when your connection returns.'
              : `You are offline. ${pendingSyncWrites} progress updates are queued in this browser and will retry when your connection returns.`
            : 'You are offline. You can keep learning in this browser, and new cloud saves can resume after your connection returns.'}
        </span>
      </div>
    );
  }

  if (pendingSyncWrites > 0) {
    return (
      <div className="offline-banner is-sync-pending" role="alert" aria-live="assertive" aria-atomic="true">
        <span className="offline-icon" aria-hidden="true">!</span>
        <span className="offline-text">
          {pendingSyncWrites === 1
            ? 'One progress update is queued to retry.'
            : `${pendingSyncWrites} progress updates are queued to retry.`}
          {' '}Your latest in-tab progress is still here.
        </span>
        <div className="offline-actions">
          <button
            type="button"
            className="offline-retry"
            onClick={() => retryPendingSyncWrites()}
            disabled={syncRetryInFlight}
            aria-label={syncRetryInFlight ? 'Retrying queued progress updates' : 'Retry queued progress updates now'}
          >
            {syncRetryInFlight ? 'Retrying...' : 'Retry now'}
          </button>
        </div>
      </div>
    );
  }

  if (syncFailed > 0) {
    return (
      <div className="offline-banner is-sync-failed" role="alert" aria-live="assertive" aria-atomic="true">
        <span className="offline-icon" aria-hidden="true">!</span>
        <span className="offline-text">
          {syncFailed === 1
            ? 'One progress update could not be confirmed in the cloud.'
            : `${syncFailed} progress updates could not be confirmed in the cloud.`}
          {' '}Your latest local state is still visible in this browser session.
        </span>
        <button
          type="button"
          className="offline-dismiss"
          onClick={clearSyncFailed}
          aria-label="Hide sync warning"
        >
          Hide
        </button>
      </div>
    );
  }

  if (showOnlineToast) {
    return (
      <div className="offline-banner is-online" role="status" aria-live="polite" aria-atomic="true">
        <span className="offline-icon" aria-hidden="true">+</span>
        <span className="offline-text">
          {pendingSyncWrites > 0
            ? 'Back online. Queued progress updates can retry now.'
            : 'Back online. New progress saves can reach the cloud again.'}
        </span>
      </div>
    );
  }

  return null;
}
