// ═══════════════════════════════════════════════
// BADGE UNLOCK — Full-screen badge earn animation
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useProgress } from '../context/ProgressContext';

export function BadgeUnlock() {
  const { newBadge, clearNewBadge } = useProgress();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (newBadge) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(clearNewBadge, 400);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [newBadge, clearNewBadge]);

  if (!newBadge) return null;

  return (
    <div className="badge-unlock-overlay" onClick={() => { setShow(false); setTimeout(clearNewBadge, 400); }}>
      <div className={`badge-unlock ${show ? 'show' : ''}`}>
        <span className="bu-icon">{newBadge.icon}</span>
        <div className="bu-label">Badge Unlocked!</div>
        <div className="bu-name">{newBadge.name}</div>
        <div className="bu-desc">{newBadge.desc}</div>
      </div>
    </div>
  );
}
