import { useEffect, useRef, useState } from 'react';
import { useProgressData } from '../../providers';

const ONLINE_TOAST_DURATION = 3000;

function getInitialOfflineState() {
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}

export function OfflineIndicator() {
  const [offline, setOffline] = useState(getInitialOfflineState);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const { syncFailed, clearSyncFailed } = useProgressData();
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
          You are offline. You can keep learning in this browser, and new cloud saves can resume after your connection returns.
        </span>
      </div>
    );
  }

  if (syncFailed > 0) {
    return (
      <div className="offline-banner is-sync-failed" role="alert" aria-live="assertive" aria-atomic="true">
        <span className="offline-icon" aria-hidden="true">!</span>
        <span className="offline-text">
          {syncFailed === 1
            ? 'One progress update could not reach the cloud yet.'
            : `${syncFailed} progress updates could not reach the cloud yet.`}
          {' '}Your latest work is still available in this browser.
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
        <span className="offline-text">Back online. New progress saves can reach the cloud again.</span>
      </div>
    );
  }

  return null;
}
