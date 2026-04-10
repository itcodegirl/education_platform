// ═══════════════════════════════════════════════
// WHAT'S NEW — Changelog modal shown once per version
// Update APP_VERSION and CHANGELOG when shipping
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';

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

export function WhatsNew() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    if (seen !== APP_VERSION) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem(SEEN_KEY, APP_VERSION);
  };

  if (!show) return null;

  const latest = CHANGELOG[0];

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="search-modal" style={{ maxWidth: 480 }}>
        <div className="search-input-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 20 }}>🎉</span>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
            What's New
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}>
            v{latest.version}
          </span>
          <button
            type="button"
            className="cheatsheet-close"
            onClick={handleClose}
            aria-label="Close changelog"
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, fontFamily: "'Space Mono', monospace" }}>
            {latest.date}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {latest.items.map((item, i) => (
              <li key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                fontSize: 14, lineHeight: 1.5, color: 'var(--text)',
              }}>
                <span style={{ color: 'var(--pink)', fontWeight: 700, flexShrink: 0 }}>→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleClose}
            style={{
              width: '100%', marginTop: 20, padding: '12px 20px',
              borderRadius: 10, border: 'none',
              background: 'var(--pink)', color: 'var(--bg-deep)',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => e.target.style.filter = 'brightness(1.15)'}
            onMouseLeave={(e) => e.target.style.filter = 'none'}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
