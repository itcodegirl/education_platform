# Reward and Progress Trust Policy

This policy defines the intended reward behavior for progress-engine hardening. It started as the source-of-truth foundation and now also records the current checkpoint.

## Stable Reward Keys

Reward-critical actions should use stable event keys before XP is awarded:

- `lesson_complete:{lessonKey}`
- `quiz_complete:{quizKey}`
- `quiz_perfect:{quizKey}`
- `challenge_complete:{challengeId}`

These keys should be treated as idempotency keys. A learner may repeat a learning action for practice, but the same reward key should not grant XP more than once.

The local reward-event ledger also records learner-scoped event keys that are shaped for a future backend reward-event table:

- `lesson-complete:{lessonId}:{learnerKey}`
- `quiz-base:{quizKey}:{learnerKey}`
- `quiz-perfect:{quizKey}:{learnerKey}`
- `challenge-complete:{challengeId}:{learnerKey}`

The legacy reward keys remain as a compatibility guard so existing same-device progress data still prevents duplicate XP while the newer ledger records traceable events going forward.

## XP Award Rules

- Lesson completion XP is awarded once per stable lesson key.
- Quiz completion XP is awarded once per stable quiz key.
- Quiz perfect-score bonus XP is awarded once per stable quiz key.
- Challenge completion XP is awarded once per stable challenge ID.
- Uncompleting and recompleting a lesson should not create another lesson-completion XP event.
- Challenge completion is a learner-motivation signal, not secure certification. Client-side challenge tests can guide practice, but should not be treated as tamper-proof proof of skill.

## Quiz Retry Rules

- Learners can retry quizzes for learning.
- Retries should update the stored best score when the new score is better.
- Retries should not repeatedly grant base quiz XP.
- Perfect-score bonus XP should be awarded once, even if the learner earns perfect multiple times.

## Streak Qualifying Actions

Streaks should reflect real learning activity. Qualifying actions are:

- Completing a lesson
- Submitting a quiz
- Completing a challenge
- Other explicit learning actions that are intentionally added to the policy later

App load, navigation, and passive session activity should not count as streak activity.

The current implementation uses the existing UTC date helpers (`YYYY-MM-DD` from `toISOString()`) for streak and daily-goal dates. This preserves current stored date semantics without a migration. A future timezone batch can decide whether learner-local dates should replace UTC dates.

## Persistence Policy

- Reward-critical actions should become idempotent in runtime code.
- Future implementation should prefer reward-event records, an equivalent stable tracking table, or a server-side atomic award operation.
- Failed reward/progress writes should be surfaced to the learner or queued for retry.
- Silent local-only success should not be shown as durable progress unless the app can retry or reconcile the write.

## Current Status

The policy constants live in `src/services/rewardPolicy.js`. Runtime hardening now covers:

- Lesson completion XP idempotency for same-device uncomplete/recomplete flows.
- Quiz retry reward idempotency for base completion XP and perfect-score bonus XP.
- Best-score preservation when quiz retries improve a learner's score.
- Activity-based streak updates from explicit learning actions rather than app load.
- Same-device challenge completion persistence and dedupe.
- Sync-failed state marking for core localStorage and route-action write failures.
- A local reward-event foundation in `src/engine/rewards/` with event types, stable learner-scoped event keys, local ledger storage, dedupe behavior, and a shared processor/runtime helper.
- Lesson, quiz base, quiz perfect, and challenge XP paths now flow through the local reward-event processor while keeping legacy reward history as the first compatibility guard.
- Reward queue storage now records pending, processed, skipped, failed, applied-unrecorded, and reconciled local reward events for same-device recovery and inspection.
- Reconciliation utilities can resolve already-awarded local events against the processed ledger or legacy reward history without replaying XP.

Remaining future work:

- Add a schema-backed reward-event table, equivalent stable tracking table, or server-side atomic award operation for cross-device reward idempotency.
- The proposed backend reward-event schema is documented in `docs/backend-reward-events.md` with a draft SQL artifact in `docs/sql/reward-events-schema-draft.sql`; it is not deployed or called by runtime code yet.
- The future atomic award contract is documented in `docs/atomic-reward-award.md` with a draft RPC in `docs/sql/atomic-reward-award-draft.sql` and an unused frontend wrapper in `src/services/rewardEventService.js`.
- The cross-device sync strategy is documented in `docs/reward-sync-strategy.md` with an unused planning scaffold in `src/services/rewardSyncService.js`.
- Move challenge completion history from same-device localStorage toward backend-backed persistence.
- Add backend-backed durable retry/reconciliation and optional background queue processing.
- Decide whether learner-local streak dates should replace the current UTC date semantics.
- Reconcile or backfill local reward-event ledger records with backend events if/when a server-side reward ledger is introduced.
