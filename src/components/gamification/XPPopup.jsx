// ═══════════════════════════════════════════════
// XP POPUP — Shows "+25 XP" with optional level up.
// Lifecycle (visible time + fade-out + queue clear)
// is owned by useAutoDismissReveal.
// ═══════════════════════════════════════════════

import { useXP } from '../../providers';
import { useAutoDismissReveal } from '../../hooks/useAutoDismissReveal';

const FADE_OUT_MS = 400;
const VISIBLE_MS_DEFAULT = 1200;
const VISIBLE_MS_LEVEL_UP = 1800;

export function XPPopup() {
  const { xpPopup, clearXPPopup } = useXP();

  const { show } = useAutoDismissReveal({
    active: xpPopup,
    visibleMs: xpPopup?.newLevel ? VISIBLE_MS_LEVEL_UP : VISIBLE_MS_DEFAULT,
    fadeOutMs: FADE_OUT_MS,
    onClear: clearXPPopup,
  });

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
      <div className="xp-scope">Motivational progress</div>
      {xpPopup.newLevel && (
        <div className="xp-lvlup">Level {xpPopup.newLevel} reached</div>
      )}
    </div>
  );
}
