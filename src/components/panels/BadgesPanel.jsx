import { useRef } from 'react';
import { useProgress, BADGE_DEFS } from '../../providers';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function BadgesPanel({ isOpen, onClose }) {
  const { earnedBadges } = useProgress();
  const modalRef = useRef(null);

  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });

  if (!isOpen) return null;

  const earnedCount = Object.keys(earnedBadges).length;

  return (
    <div className="search-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Badges (${earnedCount} of ${BADGE_DEFS.length} earned)`}
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Milestones earned</p>
            <h2>Badges ({earnedCount}/{BADGE_DEFS.length})</h2>
          </div>
          <button type="button" className="cheatsheet-close" onClick={onClose} aria-label="Close badges">
            ×
          </button>
        </div>
        <div className="cheatsheet-body">
          <p className="panel-meta">
            Badges make your momentum visible. Earn them by finishing lessons, holding streaks, and pushing through practice.
          </p>
          <div className="badges-grid">
            {BADGE_DEFS.map((badge) => {
              const earned = earnedBadges[badge.id];
              return (
                <div key={badge.id} className={`badge-card ${earned ? 'earned' : 'locked'}`}>
                  <span className="badge-icon">{badge.icon}</span>
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-desc">{badge.desc}</div>
                  {earned && <div className="badge-date">Earned {earned.date}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
