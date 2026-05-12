// ═══════════════════════════════════════════════
// KEYBOARD NAV HOOK
// ═══════════════════════════════════════════════

import { useEffect, useRef } from 'react';

export function useKeyboardNav({
  onNext, onPrev, onMarkDone, onSearch, onSwitchCourse, onToggleSidebar,
}) {
  const callbacksRef = useRef({
    onNext,
    onPrev,
    onMarkDone,
    onSearch,
    onSwitchCourse,
    onToggleSidebar,
  });

  useEffect(() => {
    callbacksRef.current = {
      onNext,
      onPrev,
      onMarkDone,
      onSearch,
      onSwitchCourse,
      onToggleSidebar,
    };
  }, [onNext, onPrev, onMarkDone, onSearch, onSwitchCourse, onToggleSidebar]);

  useEffect(() => {
    const handler = (e) => {
      const callbacks = callbacksRef.current;
      const target = e.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.closest('[contenteditable="true"], [role="textbox"], .monaco-editor'));

      if (isEditable) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        callbacks.onSearch();
        return;
      }

      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        callbacks.onSearch();
        return;
      }

      if (e.altKey || e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case 'ArrowRight': callbacks.onNext(); break;
        case 'ArrowLeft': callbacks.onPrev(); break;
        case 'd': case 'D': callbacks.onMarkDone(); break;
        case 'm': case 'M': callbacks.onToggleSidebar(); break;
        case '1': case '2': case '3': case '4':
          callbacks.onSwitchCourse(parseInt(e.key) - 1);
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
