// ═══════════════════════════════════════════════
// WELCOME BACK — Resume prompt on return
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react';

export function WelcomeBack({ isOpen, onClose, onResume, displayName, lastPosition, completedCount }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const timeAgo = lastPosition.time
    ? formatTimeAgo(lastPosition.time)
    : '';

  const greeting = getGreeting();

  return (
    <div className="welcome-overlay" onClick={onClose}>
      <div className={`welcome-card ${show ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="welcome-wave">👋</div>
        <h2 className="welcome-title">
          {greeting}, {displayName || 'Learner'}!
        </h2>
        <p className="welcome-sub">Welcome back to CodeHerWay</p>

        {lastPosition.les && (
          <div className="welcome-resume-box">
            <div className="welcome-resume-label">Continue where you left off</div>
            <div className="welcome-resume-path">
              <span>{lastPosition.course}</span>
              <span className="welcome-sep">›</span>
              <span>{lastPosition.mod}</span>
            </div>
            <div className="welcome-resume-lesson">{lastPosition.les}</div>
            {timeAgo && <div className="welcome-time">{timeAgo}</div>}
          </div>
        )}

        <div className="welcome-stats-row">
          <div className="welcome-stat">
            <span className="welcome-stat-num">{completedCount}</span>
            <span className="welcome-stat-label">lessons done</span>
          </div>
        </div>

        <div className="welcome-actions">
          <button className="welcome-resume-btn" onClick={onResume}>
            Continue Learning →
          </button>
          <button className="welcome-dismiss" onClick={onClose}>
            Start fresh
          </button>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}
