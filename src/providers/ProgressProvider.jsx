// Re-export from context — providers/ is the public API. The
// three narrow hooks (useProgressData, useXP, useSR) are the
// supported entry points; the previous aggregate `useProgress`
// was dead code after migration and was removed so a streak tick
// cannot re-render a screen that only reads completion data.
export {
  ProgressProvider,
  useProgressData,
  useXP,
  useSR,
} from '../context/ProgressContext';
export { BADGE_DEFS } from '../data/badges';
