# Reward and Progress Trust Policy

This policy defines the intended reward behavior for progress-engine hardening. It started as the source-of-truth foundation and now also records the current checkpoint.

## Stable Reward Keys

Reward-critical actions should use stable event keys before XP is awarded:

- `lesson_complete:{lessonKey}`
- `quiz_complete:{quizKey}`
- `quiz_perfect:{quizKey}`
- `challenge_complete:{challengeId}`

These keys should be treated as idempotency keys. A learner may repeat a learning action for practice, but the same reward key should not grant XP more than once.

The local reward-event ledger also records learner-scoped event keys that match the backend reward-event direction:

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
- Runtime implementation should prefer reward-event records, an equivalent stable tracking table, or a server-side atomic award operation when backend sync is explicitly enabled.
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
- Additive Supabase migrations define `public.reward_events` and the `public.award_reward_event()` RPC.
- `src/services/rewardEventService.js` normalizes backend reward results and safely returns `disabled` when Supabase config or the feature flag is unavailable.
- Backend reward sync is gated by `VITE_REWARD_BACKEND_SYNC_ENABLED=true` and authenticated user context; local reward behavior remains the default fallback.

Remaining future work:

- Apply the backend reward migrations to a real Supabase project and validate RLS/RPC behavior with authenticated users.
- Move challenge completion history from same-device localStorage toward backend-backed persistence.
- Add durable retry/reconciliation for failed writes. The prior `feat/reward-retry-reconciliation` work is not merged into this branch.
- Decide whether learner-local streak dates should replace the current UTC date semantics.
- Decide if and how learners can explicitly import local reward history into backend reward events.
