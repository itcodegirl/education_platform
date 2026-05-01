import { useEffect, useRef, memo } from 'react';
import { useProgressData, useXP, useAuth } from '../../providers';
import { getLevel, getXPInLevel, XP_PER_LEVEL, DAILY_GOAL } from '../../utils/helpers';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { navigateTo } from '../../routes/routeUtils';

export const ProfilePopover = memo(function ProfilePopover({ isOpen, onClose, isMobile }) {
  const { completed = [] } = useProgressData();
  const { xpTotal = 0, streak = 0, dailyCount = 0 } = useXP();
  const { user, signOut } = useAuth();
  const popoverRef = useRef(null);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Coder';
  const email = user?.email || '';
  const level = getLevel(xpTotal);
  const inLevel = getXPInLevel(xpTotal);
  const xpPct = Math.round((inLevel / XP_PER_LEVEL) * 100);
  const lessonsToGoal = Math.max(DAILY_GOAL - dailyCount, 0);
  const momentumMessage = dailyCount >= DAILY_GOAL
    ? 'Daily goal complete. Keep the streak alive while you have momentum.'
    : lessonsToGoal === 1
      ? 'One more lesson locks in today\'s goal.'
      : `${lessonsToGoal} more lessons to hit today\'s goal.`;

  useFocusTrap(popoverRef, { enabled: isOpen, onEscape: onClose });

  // Close on click-outside
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClick = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };

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
      <div className="pp-identity">
        <div className="pp-avatar">{displayName.charAt(0).toUpperCase()}</div>
        <div className="pp-identity-text">
          <span className="pp-name">{displayName}</span>
          <span className="pp-email">{email}</span>
          <span className="pp-momentum">{momentumMessage}</span>
        </div>
        <span className="pp-level-badge">Lv {level}</span>
      </div>

      <div className="pp-stats">
        <div className="pp-stat">
          <span className="pp-stat-value">{completed.length}</span>
          <span className="pp-stat-label">Lessons</span>
        </div>
        <div className="pp-stat">
          <span className="pp-stat-value">{streak}{streak > 0 ? '??' : ''}</span>
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
            {Array.from({ length: DAILY_GOAL }, (_, index) => (
              <span key={index} className={`pp-goal-dot ${index < dailyCount ? 'filled' : ''}`} />
            ))}
          </div>
          <span className="pp-stat-label">Today</span>
        </div>
      </div>

      <div className="pp-time">
        <span>{Math.floor((completed.length * 3) / 60)}h total study time</span>
      </div>

      <div className="pp-actions">
        <button
          type="button"
          className="pp-profile-btn"
          onClick={() => {
            navigateTo('/profile');
            onClose();
          }}
        >
          Open Profile
        </button>
        <button type="button" className="pp-signout" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
});
