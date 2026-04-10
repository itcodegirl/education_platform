// ═══════════════════════════════════════════════
// KEYBOARD NAV HOOK
// ═══════════════════════════════════════════════

import { useEffect } from 'react';

export function useKeyboardNav({
  onNext, onPrev, onMarkDone, onSearch, onSwitchCourse, onToggleSidebar, onShowShortcuts,
}) {
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearch();
        return;
      }

      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onSearch();
        return;
      }

      switch (e.key) {
        case 'ArrowRight': onNext(); break;
        case 'ArrowLeft': onPrev(); break;
        case 'd': case 'D': onMarkDone(); break;
        case 'm': case 'M': onToggleSidebar(); break;
        case '?': onShowShortcuts?.(); break;
        case '1': case '2': case '3': case '4':
          onSwitchCourse(parseInt(e.key) - 1);
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onNext, onPrev, onMarkDone, onSearch, onSwitchCourse, onToggleSidebar, onShowShortcuts]);
}
