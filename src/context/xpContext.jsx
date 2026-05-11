import { createContext, useContext } from 'react';

export const XPContext = createContext({
  xpTotal: 0,
  awardXP: () => {},
  xpPopup: null,
  clearXPPopup: () => {},
  streak: 0,
  // pausedStreak is null when there is no lapsed streak to revive.
  // Shape when present: { days: number, lastDate: 'YYYY-MM-DD' }.
  pausedStreak: null,
  dailyCount: 0,
  recordDailyActivity: () => {},
  earnedBadges: [],
  newBadge: null,
  clearNewBadge: () => {},
});

export function useXP() {
  return useContext(XPContext);
}
