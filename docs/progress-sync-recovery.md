# Progress Sync Recovery

## What this covers

CodeHerWay now keeps a same-browser retry queue for:

- direct optimistic progress writes that originate inside `ProgressContext`
- recoverable lesson route mutations that fail inside `learnRouteAction` and return a retry-safe write descriptor

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
- lesson completion route toggles
- bookmark route toggles

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

## Observability

When analytics is configured, sync recovery emits privacy-safe events:

- `progress_sync_queued`
- `progress_sync_replay`

These events include operation names, retry triggers, queue counts, replay counts, and failed operation summaries. They intentionally do not include learner IDs, lesson keys, note content, queue payloads, or raw database error messages.

The learner-facing banner also distinguishes between queued writes, active retry, and a failed retry with pending writes still preserved in the browser.

## What this does not promise yet

- cross-device recovery
- durable recovery when localStorage itself is unavailable
- retry/import for route-fetcher mutations that do not return a recoverable write descriptor
- reward backend replay/import beyond the existing reward-event work
- production alerting or backend observability for repeated sync failures

Because of those limits, the product can now honestly claim same-browser retry for direct progress writes plus recoverable lesson progress/bookmark route mutations, but it should not claim universal cloud recovery for every failed mutation.

## Verification

- `npm run check`
- `npm run test:e2e`
- `npx vitest run src/routes/appRouter.test.jsx`
- `npx vitest run src/context/ProgressContext.test.jsx`
- `npx vitest run src/hooks/useFetcherSyncFailure.test.jsx`
- `npx vitest run src/services/progressSyncTelemetry.test.js`
- `npx vitest run src/services/progressWriteQueue.test.js`
