// useTodayKey — returns the current date as a YYYY-MM-DD UTC
// string and re-renders the consumer when the date changes.
//
// Why this exists:
//   ProgressContext exposes activeStreak / activeDailyCount /
//   pausedStreak by passing getTodayString() into a pure helper
//   from inside a useMemo. The useMemo deps are the persisted
//   counters, so the memo doesn't recompute purely because
//   wall-clock time crossed midnight inside an open tab. A
//   learner who left their tab open across midnight would see
//   yesterday's streak/daily-count values until they reloaded
//   the page or did an activity.
//
// Strategy:
//   1. On mount, schedule a single setTimeout that fires ~100ms
//      after the next UTC midnight. When it fires, update the
//      key and schedule the next one. More efficient than
//      polling at a fixed interval.
//   2. Also listen for visibilitychange — browsers throttle
//      setTimeout when the tab is hidden, and machine sleep can
//      skip the scheduled fire entirely. When the tab becomes
//      visible again, re-check immediately.
//
// Consumers thread the returned key into useMemo deps so the
// derived display values recompute on midnight crossings.

import { useEffect, useState } from 'react';
import { getTodayString } from '../utils/helpers';

const SAFETY_BUFFER_MS = 100;

export function useTodayKey() {
  const [todayKey, setTodayKey] = useState(() => getTodayString());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let timeoutId = null;

    const refreshIfStale = () => {
      const next = getTodayString();
      // Use the functional setter so we read the latest committed
      // key without adding it to deps (and re-arming the timer
      // every time it ticks).
      setTodayKey((prev) => (prev === next ? prev : next));
    };

    const scheduleNextMidnight = () => {
      const now = new Date();
      const nextMidnight = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        SAFETY_BUFFER_MS,
      );
      const delay = Math.max(nextMidnight - now.getTime(), SAFETY_BUFFER_MS);
      timeoutId = window.setTimeout(() => {
        refreshIfStale();
        scheduleNextMidnight();
      }, delay);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Sleep / throttling can have skipped the scheduled fire.
        // Refresh immediately and re-arm the next timer from now.
        refreshIfStale();
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        scheduleNextMidnight();
      }
    };

    scheduleNextMidnight();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return todayKey;
}
