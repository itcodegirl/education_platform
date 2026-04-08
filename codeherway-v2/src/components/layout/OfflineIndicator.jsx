// ═══════════════════════════════════════════════
// OFFLINE INDICATOR — Shows when connection is lost
// Auto-hides when connection returns
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';

const ONLINE_TOAST_DURATION = 3000;

export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    let timer;
    const handleOffline = () => {
      setOffline(true);
      setShowBanner(true);
    };
    const handleOnline = () => {
      setOffline(false);
      timer = setTimeout(() => setShowBanner(false), ONLINE_TOAST_DURATION);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!showBanner && !offline) return null;

  return (
    <div className={`offline-banner ${offline ? 'is-offline' : 'is-online'}`}>
      <span className="offline-icon">{offline ? '📡' : '✓'}</span>
      <span className="offline-text">
        {offline
          ? 'You\'re offline — lessons are available from cache. Progress will sync when you reconnect.'
          : 'Back online — syncing your progress.'}
      </span>
    </div>
  );
}
