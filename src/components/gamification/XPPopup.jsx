// ═══════════════════════════════════════════════
// XP POPUP — Shows "+25 XP" with optional level up
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useProgress } from '../../providers';

export function XPPopup() {
  const { xpPopup, clearXPPopup } = useProgress();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (xpPopup) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(clearXPPopup, 400);
      }, xpPopup.newLevel ? 2500 : 1500);
      return () => clearTimeout(timer);
    }
  }, [xpPopup, clearXPPopup]);

  if (!xpPopup) return null;

  return (
    <div
      className={`xp-popup ${show ? 'show' : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="xp-gain">+{xpPopup.amount} XP</div>
      <div className="xp-reason">{xpPopup.reason}</div>
      {xpPopup.newLevel && (
        <div className="xp-lvlup">🎉 Level Up! Level {xpPopup.newLevel}</div>
      )}
    </div>
  );
}
