// ═══════════════════════════════════════════════
// useSwipeNav — Swipe left/right for lesson navigation
// Only active on touch devices
// ═══════════════════════════════════════════════

import { useEffect, useRef } from 'react';

export function useSwipeNav({ onNext, onPrev, ref }) {
  const touchStart = useRef(null);

  useEffect(() => {
    const el = ref?.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = (e) => {
      if (!touchStart.current || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      touchStart.current = null;

      // Only trigger if horizontal swipe > 80px and mostly horizontal
      if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.5) return;

      // Don't swipe if user was in an input/textarea/editor
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.closest('.cpv-editor-wrap')) return;

      if (dx > 0) onPrev();
      else onNext();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onNext, onPrev, ref]);
}
