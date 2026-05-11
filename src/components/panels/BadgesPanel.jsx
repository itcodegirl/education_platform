import { useRef } from 'react';
import { useXP, BADGE_DEFS } from '../../providers';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PROGRESS_SYNC_COPY } from '../../constants/progressCopy';

export function BadgesPanel({ isOpen, onClose }) {
  const { earnedBadges } = useXP();
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
          <p className="panel-meta">{PROGRESS_SYNC_COPY}</p>
          <p className="panel-meta panel-meta-trust">
            Badges are CodeHerWay in-app milestones, not external credentials. XP and streaks are motivational signals.
          </p>
          {earnedCount === 0 && (
            <div className="sr-empty">
              <span className="sr-empty-icon" aria-hidden="true">☆</span>
              <p><strong>No badges earned yet.</strong></p>
              <p className="empty-state-msg">
                Start with one lesson. Badges will appear here after real progress,
                so this panel stays celebratory instead of noisy.
              </p>
              <button type="button" className="empty-state-action" onClick={onClose}>
                Back to lesson
              </button>
            </div>
          )}
          {/* List semantics + per-badge aria-label so screen-reader users
              can tell earned from locked badges. Without this, the
              earned/locked distinction was visual only — the emoji,
              name, and description sounded identical for both states. */}
          <ul className="badges-grid" aria-label={`${earnedCount} of ${BADGE_DEFS.length} badges earned`}>
            {BADGE_DEFS.map((badge) => {
              const earned = earnedBadges[badge.id];
              const status = earned ? `earned on ${earned.date}` : 'locked';
              return (
                <li
                  key={badge.id}
                  className={`badge-card ${earned ? 'earned' : 'locked'}`}
                  aria-label={`${badge.name}, ${status}. ${badge.desc}`}
                >
                  <span className="badge-icon" aria-hidden="true">{badge.icon}</span>
                  <div className="badge-name">{badge.name}</div>
                  <div className="badge-desc">{badge.desc}</div>
                  {earned && <div className="badge-date">Earned here {earned.date}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
