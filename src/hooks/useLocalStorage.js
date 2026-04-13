// ═══════════════════════════════════════════════
// useLocalStorage — drop-in replacement for useState
// that persists to localStorage under a given key.
//
// Components used to read/write localStorage directly
// (see LessonView, Sidebar, ThemeContext, etc.). Use
// this hook instead so the storage contract lives in
// one place:
//
//   const [tasks, setTasks] = useLocalStorage('chw-tasks', {});
//   setTasks(prev => ({ ...prev, [lessonKey]: [...] }));
//
// JSON-encoded values only. SSR-safe (returns the
// initial value when window is undefined). Silently
// degrades if localStorage is disabled (e.g. private
// browsing in older Safari).
// ═══════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';

function readInitial(key, initialValue) {
  if (typeof window === 'undefined') return initialValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return initialValue;
    return JSON.parse(raw);
  } catch {
    return initialValue;
  }
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => readInitial(key, initialValue));

  // Keep tabs in sync when the same key changes in another tab.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event) => {
      if (event.key !== key || event.storageArea !== window.localStorage) return;
      try {
        setValue(event.newValue === null ? initialValue : JSON.parse(event.newValue));
      } catch {
        setValue(initialValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key, initialValue]);

  const setStoredValue = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(resolved));
          }
        } catch {
          /* storage full or disabled — keep the in-memory value */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setStoredValue];
}
