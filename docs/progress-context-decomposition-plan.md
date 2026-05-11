# Progress Context Decomposition Plan

## Current responsibilities

`src/context/ProgressContext.jsx` currently owns a wide mix of learner state and orchestration:

- lesson completion state
- quiz scores
- XP totals and popup queue
- streak and daily activity
- badge unlocks
- reward history and challenge completion tracking
- spaced repetition cards
- bookmarks and notes
- last course position and visited courses
- progress load orchestration
- recoverable load warnings
- retryable sync queue state

The file already publishes narrower read contexts (`useProgressData`, `useXP`, and `useSR`), but the provider implementation still concentrates too many unrelated write paths in one place.

## Proposed hooks and providers

The next decomposition step should move provider internals toward domain-focused helpers and hooks:

- `useLessonProgress`
- `useRewards`
- `useDailyActivity`
- `useBookmarks`
- `useNotes`
- `useReviewQueue`
- `useProgressSyncQueue`

Recommended provider shape after migration:

- `ProgressProvider`
  - `LessonProgressProvider`
  - `RewardsProvider`
  - `DailyActivityProvider`
  - `SavedLessonStateProvider`
  - `ReviewQueueProvider`
  - `ProgressSyncQueueProvider`

## Recommended migration order

1. Keep the current public API stable through `useProgressData`, `useXP`, and `useSR`. The legacy `useProgress` aggregate has already been removed (no remaining consumers).
2. Continue extracting pure helpers first, especially for sync warnings, bookmarks, notes, and reward-local persistence.
3. Move retry queue state and write orchestration into `useProgressSyncQueue`.
4. Move reward history, challenge completion tracking, and XP popup queues into `useRewards`.
5. Move streak and daily goal logic into `useDailyActivity`.
6. Move bookmark and note state into `useBookmarks` and `useNotes`.
7. Split the provider tree only after helper extraction has stabilized the call graph.

## Risks to avoid

- changing public context contracts while internal extraction is still underway
- mixing fetch/load orchestration with unrelated bookmark or reward logic
- moving route-dependent lesson-key normalization into too many places
- introducing duplicate writes while sync queue logic is being relocated
- attempting a full architectural rewrite in the same branch as product hardening work

## Near-term win from this branch

This branch starts the decomposition with small helper extractions for recoverable sync warnings plus bookmark/note state handling. That trims private responsibilities out of `ProgressContext` without changing how the rest of the app consumes progress state today.
