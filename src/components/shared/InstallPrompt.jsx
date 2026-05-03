// ===============================================
// PWA INSTALL PROMPT - Custom "Add to Home Screen" banner
// Only shows when the browser supports installation
// Dismissable, remembers choice for 7 days
// ===============================================

import { useState, useEffect, memo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const DISMISS_KEY = 'chw-install-dismissed';
const DISMISS_DAYS = 7;

export const InstallPrompt = memo(function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [dismissedAt, setDismissedAt] = useLocalStorage(DISMISS_KEY, 0);

  useEffect(() => {
    // Check if user dismissed recently
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DAYS * 86400000) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissedAt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissedAt(Date.now());
  };

  if (!show) return null;

  return (
    <div className="install-prompt" role="alert">
      <span className="install-icon" aria-hidden="true">↓</span>
      <span className="install-text">Install CodeHerWay for quick access</span>
      <button type="button" className="install-btn" onClick={handleInstall}>Install</button>
      <button type="button" className="install-dismiss" onClick={handleDismiss} aria-label="Dismiss install prompt">×</button>
    </div>
  );
});



