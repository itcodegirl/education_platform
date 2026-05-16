import { useEffect, useState } from 'react';

const UPDATE_READY_EVENT = 'codeherway:sw-update-ready';
const ACTIVATE_WAITING_EVENT = 'codeherway:sw-activate-waiting';

export function PWAUpdatePrompt() {
  const [update, setUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleUpdateReady = (event) => {
      setUpdate(event.detail || {});
      setIsRefreshing(false);
    };

    window.addEventListener(UPDATE_READY_EVENT, handleUpdateReady);
    return () => window.removeEventListener(UPDATE_READY_EVENT, handleUpdateReady);
  }, []);

  if (!update) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent(ACTIVATE_WAITING_EVENT, { detail: update }));
  };

  return (
    <div className="pwa-update-prompt" role="status" aria-live="polite" aria-atomic="true">
      <div className="pwa-update-copy">
        <strong>Fresh lessons are ready.</strong>
        <span>Refresh when you are ready to switch to the newest CodeHerWay version.</span>
      </div>
      <div className="pwa-update-actions">
        <button type="button" className="pwa-update-btn" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
        <button type="button" className="pwa-update-dismiss" onClick={() => setUpdate(null)}>
          Later
        </button>
      </div>
    </div>
  );
}
