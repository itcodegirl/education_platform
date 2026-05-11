// WHAT'S NEW - changelog modal shown once per version.

import { useState, useEffect, memo, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const APP_VERSION = '2.1.0';
const SEEN_KEY = 'chw-whats-new-seen';

const CHANGELOG = [
  {
    version: '2.1.0',
    date: 'April 2026',
    items: [
      'Profile page: open your avatar to review stats, badges, and progress',
      'Quiz sections are now collapsible',
      'Mobile navigation and tools have clearer touch targets',
      'Offline and sync messages now explain what is saved on this device',
      'Progress PDF export in the Stats panel is labeled as a summary',
    ],
  },
];

export const WhatsNew = memo(function WhatsNew() {
  const [show, setShow] = useState(false);
  const [seenVersion, setSeenVersion] = useLocalStorage(SEEN_KEY, '');
  const modalRef = useRef(null);

  useEffect(() => {
    if (seenVersion !== APP_VERSION) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [seenVersion]);

  const handleClose = () => {
    setShow(false);
    setSeenVersion(APP_VERSION);
  };

  useFocusTrap(modalRef, { enabled: show, onEscape: handleClose });

  if (!show) return null;

  const latest = CHANGELOG[0];

  return (
    <div className="search-overlay whats-new-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div
        ref={modalRef}
        className="search-modal wn-modal whats-new-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        aria-describedby="whats-new-date"
        tabIndex={-1}
      >
        <div className="wn-header">
          <span className="wn-icon" aria-hidden="true">!</span>
          <span id="whats-new-title" className="wn-title">What's New</span>
          <span className="wn-version">v{latest.version}</span>
          <button type="button" className="cheatsheet-close whats-new-close" onClick={handleClose} aria-label="Close changelog">x</button>
        </div>
        <div className="wn-body">
          <p id="whats-new-date" className="wn-date">{latest.date}</p>
          <ul className="wn-list">
            {latest.items.map((item, i) => (
              <li key={i} className="wn-item">
                <span className="wn-bullet" aria-hidden="true">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="wn-cta" onClick={handleClose}>Got it</button>
        </div>
      </div>
    </div>
  );
});
