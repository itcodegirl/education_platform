// ═══════════════════════════════════════════════
// CONFETTI — CSS-only celebration particles
//
// Honors `prefers-reduced-motion: reduce`. When the learner has
// asked for reduced motion the celebration is suppressed entirely —
// 50 wind-blown particles is exactly the kind of gratuitous motion
// that triggers vestibular discomfort. Trigger flows still fire so
// XP/badge state is unchanged; only the visual is omitted.
// ═══════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';

const COLORS = ['#ff6b9d', '#4ecdc4', '#ffa726', '#a78bfa', '#ff8fab', '#66d9e8', '#ffd93d'];
const DESKTOP_PIECE_COUNT = 50;
const MOBILE_PIECE_COUNT = 24;

function getInitialReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getPieceCount() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return DESKTOP_PIECE_COUNT;
  }

  return window.matchMedia('(max-width: 700px), (pointer: coarse)').matches
    ? MOBILE_PIECE_COUNT
    : DESKTOP_PIECE_COUNT;
}

export function Confetti() {
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event) => setReducedMotion(event.matches);
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    // Older Safari fallback — addListener is deprecated but still
    // present on shipping versions we support.
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);

  const pieces = useMemo(() => {
    if (reducedMotion) return [];

    return Array.from({ length: getPieceCount() }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      drift: -50 + Math.random() * 100,
    }));
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            '--delay': `${p.delay}s`,
            '--duration': `${p.duration}s`,
            '--color': p.color,
            '--size': `${p.size}px`,
            '--rotation': `${p.rotation}deg`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
