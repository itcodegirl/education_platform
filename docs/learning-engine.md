# Learning Engine Backend Trust Contract

This document records the current CodeHerWay learning-engine behavior after moving reward, challenge, and daily activity flows from local-first only to backend-trustworthy when `VITE_REWARD_BACKEND_SYNC_ENABLED=true`.

## Production Verification Status

Backend sync is code-ready but not production-verified. Local SQL checks and automated tests have passed, but real authenticated Supabase staging validation is still required before enabling backend reward sync broadly.

Use [Staging Supabase Validation Runbook](./staging-supabase-validation.md) as the release gate checklist. Do not claim production readiness or enable backend sync beyond staging until that runbook passes with an authenticated learner.

## Not Production Ready Yet

Backend sync must remain limited to staging or local until:

- Migration is applied to Supabase.
- Real authenticated learner test passes.
- Duplicate reward test passes.
- Offline/online replay test passes.
- Challenge cross-session sync passes.
- Daily/streak reconciliation passes.

## Backend Readiness Audit

Reward events are created in:

- `src/services/learningEngine.js` for lesson completion, quiz submission, and challenge completion.
- `src/hooks/useQuizSession.js` for interactive quiz sessions.

All production reward XP paths now pass through `awardRewardOnce()` in `src/engine/rewards/rewardRuntime.js`. Direct `awardXP()` calls are limited to the reward runtime and test-only consumers.

Local reward state lives in three compatibility layers:

- `chw-reward-history:{userId}` stores legacy reward keys.
- `chw-reward-event-ledger:v1:{learnerKey}` stores processed reward event keys and event evidence.
- `chw-reward-event-queue:v1:{learnerKey}` stores retry/reconciliation evidence for pending, failed, skipped, processed, applied-unrecorded, and reconciled events.

Backend reward sync is gated by:

- `VITE_REWARD_BACKEND_SYNC_ENABLED=true`
- an authenticated `user.id`
- Supabase browser config
- the `award_reward_event` RPC

The `reward_events` table stores `user_id`, not `learner_id`. The frontend RPC payload includes `learner_id`, `event_type`, `event_key`, `metadata`, `entity_id`, `xp_amount`, and `source`; the backend still derives `user_id` from `auth.uid()` and rejects learner mismatches.

Existing progress tables are:

- `progress`
- `quiz_scores`
- `xp`
- `streaks`
- `daily_goals`
- `badges`
- `sr_cards`
- `bookmarks`
- `notes`
- `courses_visited`
- `last_position`
- `reward_events`
- `challenge_completions`
- `daily_activity_events`

## Backend Reward Flow

1. A learning action creates a stable reward event key from reward type, target id, and learner id.
2. `awardRewardOnce()` writes local queue intent before attempting backend sync.
3. When the feature flag is enabled, the runtime calls `rewardEventService.awardBackendRewardEvent()`.
4. The client calls Supabase RPC `award_reward_event`.
5. The RPC inserts `reward_events` and increments `xp.total` atomically.
6. Backend `awarded` updates local UI with `skipRemote` so legacy direct XP writes do not run.
7. Backend `skipped` marks local dedupe state without awarding XP.
8. Backend `failed` or unavailable keeps local UX working, records the event as retryable, and avoids direct remote XP writes while backend sync is enabled.

The backend unique constraint `(user_id, event_key)` is the cross-device idempotency boundary. Two devices firing the same event should produce one `awarded` response and one `skipped` response.

## Offline To Online Reconciliation

If backend sync is enabled but the backend call fails, the learner still sees local XP immediately. The queued reward event is left as `failed_retryable` with `lastErrorPhase=backend-award`.

On the next successful load, `ProgressContext` calls `syncLocalRewardEventsToBackend()`. Retryable queue entries are submitted to `award_reward_event` without replaying client XP. If the backend awards XP during reconciliation, the client reloads canonical progress data so `xp.total` comes from Supabase.

Historical ledger-only events are not automatically backfilled. That is intentional: older local events may already be reflected in `xp.total` through legacy direct writes, so automatic backfill could inflate XP.

## Challenge Completion Persistence

Challenge completions now persist to `challenge_completions`:

- `learner_id` is represented as `user_id` in Supabase.
- `challenge_id` is unique per user.
- `completed_at` records first completion time.

`progressService.markChallengeCompleted()` writes to Supabase and falls back to localStorage evidence on backend failure. On load, backend completions and local-only completions are merged; local-only completions are synced to the backend when the feature flag is enabled.

Challenge validation is still client-side. The backend stores completion state; it does not yet certify code correctness server-side.

## Streak And Daily Activity

Daily activity now has an optional backend RPC:

- `record_daily_activity(learner_id, activity_key)`
- returns canonical `streak`, `dailyCount`, and `lastDate`

The client applies an optimistic daily/streak update first, then reconciles with the RPC response. The backend uses server `current_date`, so client clock changes do not control canonical streak dates. `daily_activity_events` dedupes `(user_id, activity_date, activity_key)` so repeated calls for the same learning action do not increment daily count again.

When the backend flag is disabled, the existing local-first `updateStreak` and `updateDailyGoal` paths remain unchanged.

## Safety Guarantees

- XP is awarded exactly once per backend reward event key.
- Duplicate backend reward events return `skipped` and do not inflate XP.
- Progress reload prefers backend state when sync is enabled.
- Local fallback works while offline and queues backend reconciliation evidence.
- Production reward XP paths go through `awardRewardOnce()`.
- Challenge completions survive reload and can sync across devices.
- Daily streak/count reconcile to server-owned values when the RPC is available.

## Known Limitations

- The new Supabase migration must be applied before enabling backend sync in a real environment.
- No live Supabase project validation was run from this workspace.
- Backend sync is not production-verified until the staging Supabase validation runbook passes.
- Challenge completion is persisted, not server-certified.
- Server daily activity uses the database server date, not a learner-specific timezone.
- Automatic historical reward backfill remains intentionally disabled to avoid XP inflation.

## Staging Validation - 2026-05-04

Status: blocked for live Supabase execution from this workspace.

What was verified locally:

- `reward_events` schema exists in `supabase/migrations/202604250001_create_reward_events.sql`.
- `challenge_completions` schema exists in `supabase/migrations/202605030001_backend_trust_progress_sync.sql`.
- `award_reward_event` RPC exists in `supabase/migrations/202605030001_backend_trust_progress_sync.sql`.
- `record_daily_activity` RPC exists in `supabase/migrations/202605030001_backend_trust_progress_sync.sql`.
- RLS is enabled for `reward_events`, `challenge_completions`, and `daily_activity_events`.
- User-scoped policies use `auth.uid() = user_id`.
- Both backend RPCs derive canonical identity from `auth.uid()`.
- Both backend RPCs reject `learner_id` values that do not match `auth.uid()` with `learner_id_mismatch`.
- RPC execute grants are limited to `authenticated`.

What could not be verified live:

- Applying the migration to staging.
- Authenticated reward award/duplicate flows.
- Authenticated challenge completion cross-browser sync.
- Authenticated daily/streak reconciliation.
- Offline-to-online replay against Supabase.
- Direct inspection of staging rows.

Blockers:

- `.env.local` has `VITE_REWARD_BACKEND_SYNC_ENABLED=true`, but `VITE_SUPABASE_ANON_KEY` is still the placeholder value.
- No `SUPABASE_SERVICE_KEY`, `SUPABASE_ACCESS_TOKEN`, or equivalent staging database credential is present in the shell environment.
- Supabase CLI is not installed or not available in PATH.
- No authenticated staging test learner credentials were available.

Test learner:

- None used. Live authenticated validation was not run.

Feature flag recommendation:

- Keep `VITE_REWARD_BACKEND_SYNC_ENABLED` disabled outside local/staging until the migration is applied and the authenticated checks above pass against one test learner.
- Execute [docs/staging-supabase-validation.md](./staging-supabase-validation.md) before enabling backend sync broadly.
- It is not safe to enable beyond staging from the current validation state.
