// useFocusTrap - accessibility hook for modal dialogs
//
// Keeps keyboard focus inside a container while it is open, restores
// focus to the previously focused element on close, and optionally
// handles Escape-to-close and body-scroll lock. Implements the WCAG
// 2.4.3 "Focus Order" requirement for modal dialogs.
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

import { useEffect } from 'react';

const TABBABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), textarea:not([disabled]), ' +
  '[tabindex]:not([tabindex="-1"])';

function isHiddenFromFocus(element) {
  if (!(element instanceof HTMLElement)) return true;
  if (element.hidden || element.closest('[hidden], [aria-hidden="true"]')) return true;

  const style = window.getComputedStyle(element);
  return style.display === 'none' || style.visibility === 'hidden';
}

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

    let prevOverflow;
    if (lockBodyScroll) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    const previouslyFocused = document.activeElement;
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
        (el) => !isHiddenFromFocus(el),
      );
    };

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        if (onEscape) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          onEscape();
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const tabbables = getTabbables();
      if (tabbables.length === 0) {
        event.preventDefault();
        containerRef.current?.focus();
        return;
      }

      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      const active = document.activeElement;

      if (!containerRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (lockBodyScroll) {
        document.body.style.overflow = prevOverflow || '';
      }
      if (
        previouslyFocused &&
        previouslyFocused instanceof HTMLElement &&
        document.contains(previouslyFocused)
      ) {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, enabled, initialFocus, lockBodyScroll, onEscape]);
}
