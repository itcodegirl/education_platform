// ═══════════════════════════════════════════════
// KEYBOARD NAV HOOK
// ═══════════════════════════════════════════════

import { useEffect } from 'react';

export function useKeyboardNav({
  onNext, onPrev, onMarkDone, onSearch, onSwitchCourse, onToggleSidebar,
}) {
  useEffect(() => {
    const handler = (e) => {
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
        onSearch();
        return;
      }

      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        onSearch();
        return;
      }

      if (e.altKey || e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case 'ArrowRight': onNext(); break;
        case 'ArrowLeft': onPrev(); break;
        case 'd': case 'D': onMarkDone(); break;
        case 'm': case 'M': onToggleSidebar(); break;
        case '1': case '2': case '3': case '4':
          onSwitchCourse(parseInt(e.key) - 1);
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onNext, onPrev, onMarkDone, onSearch, onSwitchCourse, onToggleSidebar]);
}
