// ═══════════════════════════════════════════════
// PROFILE POPOVER — Glassmorphism stats flyout
// Opens from the sidebar avatar. Contains all the
// gamification data (XP, streak, daily goal, progress)
// that was removed from the sidebar.
// ═══════════════════════════════════════════════

import { useEffect, useRef, memo } from 'react';
import { useProgress, useAuth } from '../../providers';
import { getLevel, getXPInLevel, XP_PER_LEVEL, DAILY_GOAL } from '../../utils/helpers';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export const ProfilePopover = memo(function ProfilePopover({ isOpen, onClose, isMobile }) {
  const { completed = [], xpTotal = 0, streak = 0, dailyCount = 0 } = useProgress();
  const { user, signOut } = useAuth();
  const popoverRef = useRef(null);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Coder';
  const email = user?.email || '';
  const level = getLevel(xpTotal);
  const inLevel = getXPInLevel(xpTotal);
  const xpPct = Math.round((inLevel / XP_PER_LEVEL) * 100);

  useFocusTrap(popoverRef, { enabled: isOpen, onEscape: onClose });

  // Close on click-outside
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Delay listener to avoid catching the opening click
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={`pp ${isMobile ? 'pp-mobile' : ''}`}
      role="dialog"
      aria-label="Your profile and stats"
      tabIndex={-1}
    >
      {/* Identity */}
      <div className="pp-identity">
        <div className="pp-avatar">{displayName.charAt(0).toUpperCase()}</div>
        <div className="pp-identity-text">
          <span className="pp-name">{displayName}</span>
          <span className="pp-email">{email}</span>
        </div>
        <span className="pp-level-badge">Lv {level}</span>
      </div>

      {/* Stat grid */}
      <div className="pp-stats">
        <div className="pp-stat">
          <span className="pp-stat-value">{completed.length}</span>
          <span className="pp-stat-label">Lessons</span>
        </div>
        <div className="pp-stat">
          <span className="pp-stat-value">{streak}{streak > 0 ? '🔥' : ''}</span>
          <span className="pp-stat-label">Streak</span>
        </div>
        <div className="pp-stat">
          <span className="pp-stat-value">
            <span className="pp-xp-num">{inLevel}</span>
            <span className="pp-xp-max">/{XP_PER_LEVEL}</span>
          </span>
          <div className="pp-xp-track">
            <div className="pp-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="pp-stat-label">XP</span>
        </div>
        <div className="pp-stat">
          <span className="pp-stat-value">{dailyCount}/{DAILY_GOAL}</span>
          <div className="pp-goal-dots">
            {Array.from({ length: DAILY_GOAL }, (_, i) => (
              <span key={i} className={`pp-goal-dot ${i < dailyCount ? 'filled' : ''}`} />
            ))}
          </div>
          <span className="pp-stat-label">Today</span>
        </div>
      </div>

      {/* Time estimate */}
      <div className="pp-time">
        <span>{Math.floor(completed.length * 3 / 60)}h total study time</span>
      </div>

      {/* Actions */}
      <div className="pp-actions">
        <button
          type="button"
          className="pp-profile-btn"
          onClick={() => { window.location.hash = '#profile'; window.location.reload(); }}
        >
          View Profile
        </button>
        <button type="button" className="pp-signout" onClick={signOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
});
