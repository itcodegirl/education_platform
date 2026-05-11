# ProgressContext Split (C5) — Plan

## Why

`src/context/ProgressContext.jsx` has grown to ~1,100 lines. It already
publishes three React contexts (`ProgressContext`, `XPContext`,
`SRContext`) and three companion hooks (`useProgressData`, `useXP`,
`useSR`) to avoid cross-domain re-renders, plus an aggregate
`useProgress` shim that previously coexisted has been removed (no
remaining call sites). The next step is to physically
split the file along those existing seams without breaking the ~30+
import sites that read from it today.

## Current consumer surface

The public API is re-exported from `src/providers/ProgressProvider.jsx`,
which is what call sites import via `'../providers'`. Inventory:

- `useProgressData` — completion, quiz scores, bookmarks, sync state
- `useXP` — XP, streak, daily count, badges, popups
- `useSR` — spaced-repetition queue + bookmarks
- `BADGE_DEFS` — re-exported from `src/data/badges.js`

These are the only names callers should read. Anything else inside
`ProgressContext.jsx` is private to the provider.

## Target shape

```
src/context/progress/
  index.js              // public re-export, matches today's surface
  ProgressProvider.jsx  // tree-mounting provider (composition only)
  progressDataContext.js // ProgressContext + useProgressData
  xpContext.js          // XPContext + useXP
  srContext.js          // SRContext + useSR
```

The `providers/ProgressProvider.jsx` shim continues to be the single
import path for every external caller. Swapping the underlying file
layout doesn't change `providers/`.

## Migration strategy (gradual, alias-driven)

1. **Land the file split behind the existing names.** All call sites
   keep importing from `'../providers'`; no caller-visible change in
   step 1.
2. **Validate that no call site still reads from the aggregated
   `useProgress` hook.** Step done: no remaining consumers; the
   aggregate has been removed from the provider re-export and the
   context module.

## Why this is its own PR

The structural move plus the deprecation alias is mechanical; the risk
is in the 30+ consumer surface area. A standalone PR makes it easy to
revert if any caller's render-coupling assumptions were wrong, without
entangling that revert with unrelated audit work.

## Acceptance checklist

- [ ] `src/context/ProgressContext.jsx` removed; replaced by
      `src/context/progress/`.
- [ ] `src/providers/ProgressProvider.jsx` re-exports from the new
      directory; no other call site changes.
- [x] Aggregate `useProgress` hook removed (no remaining consumers).
- [ ] `npm run check` passes (lint + build + bundle + lesson-label
      guard + unit suite).
- [ ] No new "missing context" runtime errors in the Playwright public
      smoke run.
