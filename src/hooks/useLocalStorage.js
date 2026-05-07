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
// initial value when window is undefined). Degrades to
// in-memory state if localStorage is disabled (e.g.
// private browsing in older Safari) and emits a sanitized
// sync-failure event for the progress shell to surface.
// ═══════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';

export const LOCAL_STORAGE_SYNC_ERROR_EVENT = 'chw:local-storage-sync-error';

function notifyLocalStorageError(key, phase) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new window.CustomEvent(LOCAL_STORAGE_SYNC_ERROR_EVENT, {
    detail: { key, phase },
  }));
}

function readInitial(key, initialValue, options = {}) {
  if (typeof window === 'undefined') return initialValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw);

    if (options.fallbackKey) {
      const fallbackRaw = window.localStorage.getItem(options.fallbackKey);
      if (fallbackRaw !== null) {
        if (options.migrateFallback) {
          window.localStorage.setItem(key, fallbackRaw);
          if (options.removeFallbackAfterMigration) {
            window.localStorage.removeItem(options.fallbackKey);
          }
        }
        return JSON.parse(fallbackRaw);
      }
    }

    return initialValue;
  } catch {
    notifyLocalStorageError(key, 'read');
    return initialValue;
  }
}

export function useLocalStorage(key, initialValue, options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const previousKeyRef = useRef(key);
  const [value, setValue] = useState(() => readInitial(key, initialValue, options));

  useEffect(() => {
    if (previousKeyRef.current === key) return;
    previousKeyRef.current = key;
    setValue(readInitial(key, initialValue, optionsRef.current));
    // initialValue is intentionally not a dependency: callers often
    // pass object literals, and key changes are the only moment when
    // this hook should reseed from storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Keep tabs in sync when the same key changes in another tab.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event) => {
      if (event.key !== key || event.storageArea !== window.localStorage) return;
      try {
        setValue(event.newValue === null ? initialValue : JSON.parse(event.newValue));
      } catch {
        notifyLocalStorageError(key, 'sync');
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
          notifyLocalStorageError(key, 'write');
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, setStoredValue];
}

