// ═══════════════════════════════════════════════
// BADGE UNLOCK — Amplified celebration with particles
//
// Two ways the celebration can end: the auto-dismiss timer
// (4.5s of show + 500ms fade), or the learner clicking "Nice!".
// Both paths schedule a single trailing setTimeout(clearNewBadge,
// 500) for the fade-out animation. We hold that timer in a single
// ref so:
//   - Unmounting while the fade is in flight cancels it.
//   - A second dismiss / a re-render that triggers a new clear
//     never schedules a duplicate clearNewBadge — which would
//     shift TWO entries off the badge queue and silently drop a
//     fresh badge the learner just earned.
// ═══════════════════════════════════════════════

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useXP } from '../../providers';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const BURST_COLORS = ['#ff6b9d', '#4ecdc4', '#ffa726', '#a78bfa', '#ff8fab', '#66d9e8', '#ffd93d'];

const VISIBLE_MS = 4500;
const FADE_OUT_MS = 500;

export function BadgeUnlock() {
  const { newBadge, clearNewBadge } = useXP();
  const [show, setShow] = useState(false);
  const modalRef = useRef(null);
  const clearTimerRef = useRef(null);

  // Generate burst particles when badge changes
  const particles = useMemo(() => {
    if (!newBadge) return [];
    return Array.from({ length: 20 }, (_, i) => ({
      angle: (i / 20) * 360,
      delay: Math.random() * 0.3,
      dist: 70 + Math.random() * 50,
      size: 4 + Math.random() * 5,
      color: BURST_COLORS[i % BURST_COLORS.length],
    }));
  }, [newBadge]);

  // Coalesces every "trigger the fade-out" path into one pending
  // timer. Cancels any prior pending clear so we never call
  // clearNewBadge twice in a row.
  const scheduleClear = useCallback(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      clearTimerRef.current = null;
      clearNewBadge();
    }, FADE_OUT_MS);
  }, [clearNewBadge]);

  useEffect(() => {
    if (!newBadge) return undefined;

    setShow(true);
    const visibleTimer = setTimeout(() => {
      setShow(false);
      scheduleClear();
    }, VISIBLE_MS);

    return () => {
      clearTimeout(visibleTimer);
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };
  }, [newBadge, scheduleClear]);

  const dismiss = useCallback(() => {
    setShow(false);
    scheduleClear();
  }, [scheduleClear]);

  // role="dialog" + aria-modal live on the INNER container, not the
  // backdrop — the backdrop is a presentational overlay, the inner
  // element is the actual announcement.
  useFocusTrap(modalRef, { enabled: !!newBadge && show, onEscape: dismiss });

  if (!newBadge) return null;

  return (
    <div
      className="badge-unlock-overlay"
      onClick={dismiss}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className={`badge-unlock ${show ? 'show' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={`Badge unlocked: ${newBadge.name}`}
        tabIndex={-1}
      >
        {/* Particle burst */}
        <div className="bu-particles" aria-hidden="true">
          {particles.map((p, i) => (
            <span
              key={i}
              className="bu-particle"
              style={{
                '--bu-angle': `${p.angle}deg`,
                '--bu-dist': `${p.dist}px`,
                '--bu-delay': `${p.delay}s`,
                '--bu-size': `${p.size}px`,
                background: p.color,
              }}
            />
          ))}
        </div>
        <div className="bu-glow" aria-hidden="true" />
        <span className="bu-icon" aria-hidden="true">{newBadge.icon}</span>
        <div className="bu-label">Badge Unlocked!</div>
        <div className="bu-name">{newBadge.name}</div>
        <div className="bu-desc">{newBadge.desc}</div>
        <button type="button" className="bu-dismiss" onClick={dismiss}>Nice!</button>
      </div>
    </div>
  );
}
