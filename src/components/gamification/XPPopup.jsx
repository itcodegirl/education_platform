// ═══════════════════════════════════════════════
// XP POPUP — Shows "+25 XP" with optional level up
//
// The visible-time + fade-out is driven by two timers:
//   - showTimer keeps the popup visible (1.5s normal, 2.5s level-up)
//   - hideTimer waits for the fade-out animation (400ms) then calls
//     clearXPPopup to shift this popup off the queue.
//
// Both timers must be tracked together so unmounting (or a new
// xpPopup arriving mid-transition) cleans them up. Without that, a
// stray hideTimer firing after a new xpPopup landed would shift the
// NEW one off the queue too — silently dropping a reward the
// learner never saw.
// ═══════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { useXP } from '../../providers';

const FADE_OUT_MS = 400;
const VISIBLE_MS_DEFAULT = 1500;
const VISIBLE_MS_LEVEL_UP = 2500;

export function XPPopup() {
  const { xpPopup, clearXPPopup } = useXP();
  const [show, setShow] = useState(false);
  // Hold the in-flight hideTimer in a ref so the effect cleanup can
  // cancel it even after it was scheduled inside the showTimer
  // callback (i.e. once we've already entered the fade-out phase).
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (!xpPopup) return undefined;

    setShow(true);
    const visibleMs = xpPopup.newLevel ? VISIBLE_MS_LEVEL_UP : VISIBLE_MS_DEFAULT;

    const showTimer = setTimeout(() => {
      setShow(false);
      hideTimerRef.current = setTimeout(() => {
        hideTimerRef.current = null;
        clearXPPopup();
      }, FADE_OUT_MS);
    }, visibleMs);

    return () => {
      clearTimeout(showTimer);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [xpPopup, clearXPPopup]);

  if (!xpPopup) return null;

  return (
    <div className={`xp-popup ${show ? 'show' : ''}`}>
      <div className="xp-gain">+{xpPopup.amount} XP</div>
      <div className="xp-reason">{xpPopup.reason}</div>
      {xpPopup.newLevel && (
        <div className="xp-lvlup">🎉 Level Up! Level {xpPopup.newLevel}</div>
      )}
    </div>
  );
}
