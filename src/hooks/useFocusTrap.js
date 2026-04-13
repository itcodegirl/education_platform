// ═══════════════════════════════════════════════
// useFocusTrap — accessibility hook for modal dialogs
//
// Keeps keyboard focus inside a container while it is open, restores
// focus to the previously-focused element on close, and optionally
// handles Escape-to-close and body-scroll lock. Implements the WCAG
// 2.4.3 "Focus Order" requirement for modal dialogs.
//
// Why not a library? One hook, ~60 LOC, no dependencies, lives next
// to the rest of our custom hooks. The shape is inspired by
// focus-trap-react but without the portal machinery.
//
// Usage:
//   const modalRef = useRef(null);
//   useFocusTrap(modalRef, {
//     enabled: isOpen,
//     onEscape: onClose,
//     lockBodyScroll: true,
//   });
//
// Then:
//   <div ref={modalRef} role="dialog" aria-modal="true" tabIndex={-1}>
//     ...
//   </div>
//
// Rules:
//   - The container itself should be tabIndex={-1} so it can receive
//     programmatic focus as the initial landing point.
//   - Give it role="dialog" (or role="alertdialog") and aria-modal.
//   - Label it with aria-label or aria-labelledby.
// ═══════════════════════════════════════════════

import { useEffect } from 'react';

const TABBABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), textarea:not([disabled]), ' +
  '[tabindex]:not([tabindex="-1"])';

/**
 * @param {React.RefObject<HTMLElement>} containerRef
 * @param {{
 *   enabled: boolean,
 *   onEscape?: () => void,
 *   lockBodyScroll?: boolean,
 *   initialFocus?: 'container' | 'first-tabbable',
 * }} options
 */
export function useFocusTrap(containerRef, options) {
  const {
    enabled,
    onEscape,
    lockBodyScroll = true,
    initialFocus = 'container',
  } = options;

  useEffect(() => {
    if (!enabled) return undefined;

    // Lock page scroll so the backdrop doesn't move while the dialog
    // is open. Stored so we can restore the user's original value.
    let prevOverflow;
    if (lockBodyScroll) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    // Remember who had focus before we opened so we can return it on
    // close. Without this, the user loses their tab position every
    // time the dialog closes.
    const previouslyFocused = document.activeElement;

    // Initial focus: either the container itself (most dialogs) or
    // the first tabbable element (useful when you want the user to
    // skip a decorative header and land on a form field directly).
    const container = containerRef.current;
    if (container) {
      if (initialFocus === 'first-tabbable') {
        const first = container.querySelector(TABBABLE_SELECTOR);
        (first || container).focus();
      } else {
        container.focus();
      }
    }

    const getTabbables = () => {
      const root = containerRef.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll(TABBABLE_SELECTOR)).filter(
        (el) => {
          // Skip elements that are display:none or inside an
          // aria-hidden subtree.
          if (el.offsetParent === null) return false;
          if (el.closest('[aria-hidden="true"]')) return false;
          return true;
        },
      );
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (onEscape) {
          onEscape();
        }
        return;
      }
      if (e.key !== 'Tab') return;

      const tabbables = getTabbables();
      if (tabbables.length === 0) {
        // Nothing tabbable — pin focus on the container.
        e.preventDefault();
        containerRef.current?.focus();
        return;
      }

      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      const active = document.activeElement;

      // If focus escaped the container entirely (e.g. a portalled
      // child closed mid-tab), pull it back.
      if (!containerRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (lockBodyScroll) {
        document.body.style.overflow = prevOverflow || '';
      }
      // Restore focus to whoever had it before, if they're still in
      // the DOM. Guards against the trigger being unmounted mid-modal.
      if (
        previouslyFocused &&
        previouslyFocused instanceof HTMLElement &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, onEscape]);
}
