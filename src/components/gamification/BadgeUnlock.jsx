// ═══════════════════════════════════════════════
// BADGE UNLOCK — Amplified celebration with particles.
// Lifecycle (visible time + fade-out + queue clear,
// including the manual 'Nice!' dismiss path) is owned
// by useAutoDismissReveal.
// ═══════════════════════════════════════════════

import { useMemo, useRef } from 'react';
import { useXP } from '../../providers';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAutoDismissReveal } from '../../hooks/useAutoDismissReveal';

const BURST_COLORS = ['#ff6b9d', '#4ecdc4', '#ffa726', '#a78bfa', '#ff8fab', '#66d9e8', '#ffd93d'];

const VISIBLE_MS = 4500;
const FADE_OUT_MS = 500;

export function BadgeUnlock() {
  const { newBadge, clearNewBadge } = useXP();
  const modalRef = useRef(null);

  const { show, dismiss } = useAutoDismissReveal({
    active: newBadge,
    visibleMs: VISIBLE_MS,
    fadeOutMs: FADE_OUT_MS,
    onClear: clearNewBadge,
  });

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
