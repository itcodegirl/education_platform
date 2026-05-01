// ═══════════════════════════════════════════════
// useAutoDismissReveal — show/fade/clear lifecycle
// for queued reward celebrations.
//
// Used by XPPopup and BadgeUnlock to drive the same
// shape: when `active` becomes truthy, the consumer's
// `show` flag flips on; after `visibleMs`, it flips
// off (CSS handles the fade-out); after another
// `fadeOutMs`, `onClear` runs to shift this entry off
// the queue so the next one can take its place.
//
// All timers are tracked together so:
//   - unmounting mid-transition cancels them,
//   - a new `active` arriving mid-transition cancels
//     the in-flight clear,
//   - manually calling `dismiss` short-circuits the
//     visible phase and goes straight to fade-out
//     without ever scheduling a duplicate clear.
//
// Without these guarantees, two clears could fire
// for the same celebration (manual dismiss + auto
// dismiss firing close together), shifting the queue
// twice and silently dropping the next entry.
// ═══════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';

export function useAutoDismissReveal({ active, visibleMs, fadeOutMs, onClear }) {
  const [show, setShow] = useState(false);
  // Single in-flight clear timer. scheduleClear cancels any prior
  // pending clear before scheduling a new one, so onClear is never
  // called more than once per `active` value.
  const clearTimerRef = useRef(null);

  const scheduleClear = useCallback(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      clearTimerRef.current = null;
      onClear();
    }, fadeOutMs);
  }, [fadeOutMs, onClear]);

  useEffect(() => {
    if (!active) return undefined;

    setShow(true);
    const visibleTimer = setTimeout(() => {
      setShow(false);
      scheduleClear();
    }, visibleMs);

    return () => {
      clearTimeout(visibleTimer);
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };
  }, [active, visibleMs, scheduleClear]);

  const dismiss = useCallback(() => {
    setShow(false);
    scheduleClear();
  }, [scheduleClear]);

  return { show, dismiss };
}
