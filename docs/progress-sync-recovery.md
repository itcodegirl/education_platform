# Progress Sync Recovery

## What this covers

CodeHerWay now keeps a same-browser retry queue for direct optimistic progress writes that originate inside `ProgressContext`.

Covered write types:

- lesson completion toggles
- quiz score saves
- XP, streak, and daily-goal updates
- badge awards
- spaced-repetition card creation and review updates
- bookmarks
- lesson notes
- last-position saves
- course-visit tracking

## Recovery behavior

When a covered write fails:

1. the in-memory learner state stays optimistic for the current tab
2. the failed write intent is serialized into a local retry queue
3. the UI shows a queued-retry banner instead of a vague sync warning

Queued writes retry through three paths:

- manual `Retry now` from the banner
- automatic retry when the browser comes back online
- automatic replay on the next signed-in session in the same browser, followed by a canonical reload

The queue uses last-write-wins compaction for overwrite-style writes such as XP totals, notes, daily-goal counters, and last position, while keeping distinct operations that must replay separately.

## What this does not promise yet

- cross-device recovery
- durable recovery when localStorage itself is unavailable
- retry/import for route-fetcher mutations that still report generic sync warnings
- reward backend replay/import beyond the existing reward-event work

Because of those limits, the product can now honestly claim same-browser retry for direct progress writes, but it should not claim universal cloud recovery for every failed mutation.

## Verification

- `npm run check`
- `npm run test:e2e`
- `npx vitest run src/context/ProgressContext.test.jsx`
- `npx vitest run src/services/progressWriteQueue.test.js`
