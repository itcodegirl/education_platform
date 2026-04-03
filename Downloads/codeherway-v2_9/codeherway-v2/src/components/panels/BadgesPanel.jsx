// ═══════════════════════════════════════════════
// BADGES PANEL — Achievement grid
// ═══════════════════════════════════════════════

import { useProgress } from '../../context/ProgressContext';
import { BADGE_DEFS } from '../../context/ProgressContext';

export function BadgesPanel({ isOpen, onClose }) {
  const { earnedBadges } = useProgress();
  if (!isOpen) return null;

  const earnedCount = Object.keys(earnedBadges).length;

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-modal">
        <div className="cheatsheet-head">
          <h2>🏆 Badges ({earnedCount}/{BADGE_DEFS.length})</h2>
          <button className="cheatsheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="cheatsheet-body">
          <div className="badges-grid">
            {BADGE_DEFS.map((b) => {
              const earned = earnedBadges[b.id];
              return (
                <div key={b.id} className={`badge-card ${earned ? 'earned' : 'locked'}`}>
                  <span className="badge-icon">{b.icon}</span>
                  <div className="badge-name">{b.name}</div>
                  <div className="badge-desc">{b.desc}</div>
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
