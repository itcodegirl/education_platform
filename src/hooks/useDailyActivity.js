// useDailyActivity — owns the streak + daily-goal counters for the
// active learner. The wall-clock guards (active vs paused streak,
// today-only daily count) live in utils/helpers; this hook owns the
// raw state, the persistence wire, and the per-day increment logic.
//
// State shape:
//   streak, streakLastDate    persisted streak as of last activity
//   dailyCount, dailyDate     persisted daily goal as of last activity
//
// Both pairs are read by the provider through this hook and then
// passed through the active/paused guards in the XP context value.

import { useCallback, useRef, useState } from 'react';
import {
  DAILY_GOAL,
  getTodayString,
  getYesterdayString,
} from '../utils/helpers';

export function useDailyActivity({ user, dbWrite, createProgressWrite }) {
  const [streak, setStreak] = useState(0);
  const [streakLastDate, setStreakLastDate] = useState('');
  const [dailyCount, setDailyCount] = useState(0);
  const [dailyDate, setDailyDate] = useState('');

  // Refs mirror the latest values so two recordDailyActivity calls
  // in the same React batch do not both see the stale "before either
  // ran" closure value and lose an increment. The ref updates
  // synchronously so the second call sees the first call's value.
  const streakStateRef = useRef({ days: 0, lastDate: '' });
  const dailyStateRef = useRef({ count: 0, date: '' });

  const replaceStreak = useCallback((days, lastDate) => {
    const nextDays = Number.isFinite(days) ? days : 0;
    const nextLastDate = typeof lastDate === 'string' ? lastDate : '';
    streakStateRef.current = { days: nextDays, lastDate: nextLastDate };
    setStreak(nextDays);
    setStreakLastDate(nextLastDate);
  }, []);

  const replaceDailyGoal = useCallback((count, goalDate) => {
    const nextCount = Number.isFinite(count) ? count : 0;
    const nextDate = typeof goalDate === 'string' ? goalDate : getTodayString();
    dailyStateRef.current = { count: nextCount, date: nextDate };
    setDailyCount(nextCount);
    setDailyDate(nextDate);
  }, []);

  const resetStreakAndDaily = useCallback(() => {
    streakStateRef.current = { days: 0, lastDate: '' };
    setStreak(0);
    setStreakLastDate('');
    dailyStateRef.current = { count: 0, date: '' };
    setDailyCount(0);
    setDailyDate('');
  }, []);

  const recordDailyActivity = useCallback(async () => {
    if (!user) return;
    const today = getTodayString();
    const yesterday = getYesterdayString();

    const dailyState = dailyStateRef.current;
    const currentCount = dailyState.date === today ? dailyState.count : 0;
    const newCount = Math.min(currentCount + 1, DAILY_GOAL);
    const streakState = streakStateRef.current;

    if (streakState.lastDate !== today) {
      const nextStreakDays = streakState.lastDate === yesterday ? streakState.days + 1 : 1;
      streakStateRef.current = { days: nextStreakDays, lastDate: today };
      setStreak(nextStreakDays);
      setStreakLastDate(today);
      dbWrite(
        createProgressWrite('updateStreak', {
          days: nextStreakDays,
          lastDate: today,
        }),
        'updateStreak',
      );
    }

    dailyStateRef.current = { count: newCount, date: today };
    setDailyCount(newCount);
    setDailyDate(today);

    dbWrite(
      createProgressWrite('updateDailyGoal', {
        goalDate: today,
        count: newCount,
      }),
      'updateDailyGoal',
    );
  }, [user, dbWrite, createProgressWrite]);

  return {
    streak,
    streakLastDate,
    dailyCount,
    dailyDate,
    recordDailyActivity,
    replaceStreak,
    replaceDailyGoal,
    resetStreakAndDaily,
  };
}
