// ═══════════════════════════════════════════════
// WHAT'S NEW — Changelog modal shown once per version
// Update APP_VERSION and CHANGELOG when shipping
// ═══════════════════════════════════════════════

import { useState, useEffect, memo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const APP_VERSION = '2.1.0';
const SEEN_KEY = 'chw-whats-new-seen';

const CHANGELOG = [
  {
    version: '2.1.0',
    date: 'April 2026',
    items: [
      'Profile page — tap your avatar to see stats, badges, and progress',
      'Keyboard shortcuts — press ? to see all hotkeys',
      'Quiz sections are now collapsible',
      'Swipe left/right on mobile to navigate lessons',
      'Reading progress bar at the top of each lesson',
      'Install as an app — look for the install banner',
      'Offline support — study lessons without internet',
      'Progress PDF export in the Stats panel',
    ],
  },
];

export const WhatsNew = memo(function WhatsNew() {
  const [show, setShow] = useState(false);
  const [seenVersion, setSeenVersion] = useLocalStorage(SEEN_KEY, '');

  useEffect(() => {
    if (seenVersion !== APP_VERSION) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [seenVersion]);

  const handleClose = () => {
    setShow(false);
    setSeenVersion(APP_VERSION);
  };

  if (!show) return null;

  const latest = CHANGELOG[0];

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="search-modal wn-modal">
        <div className="wn-header">
          <span className="wn-icon">🎉</span>
          <span className="wn-title">What's New</span>
          <span className="wn-version">v{latest.version}</span>
          <button type="button" className="cheatsheet-close" onClick={handleClose} aria-label="Close changelog">✕</button>
        </div>
        <div className="wn-body">
          <p className="wn-date">{latest.date}</p>
          <ul className="wn-list">
            {latest.items.map((item, i) => (
              <li key={i} className="wn-item">
                <span className="wn-bullet">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="wn-cta" onClick={handleClose}>Got it!</button>
        </div>
      </div>
    </div>
  );
});
