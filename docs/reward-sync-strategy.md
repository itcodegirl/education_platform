# Reward Sync Strategy

This document describes the unified reward sync behavior after merging the local retry/reconciliation reward branch with the Supabase backend reward branch.

## Current Runtime Strategy

Local reward behavior remains the default and fallback path.

Backend reward sync is attempted only when all of these are true:

- The learner is authenticated.
- `VITE_REWARD_BACKEND_SYNC_ENABLED=true`.
- The reward runtime has a stable learner-scoped event key.
- Supabase browser config and `public.award_reward_event()` are available.

If any condition is missing, rewards continue through the local reward-event ledger, local queue, and legacy reward-history guard.

Before attempting a backend award, the runtime checks the local ledger. If the event was already processed locally, the backend is not called and XP is not awarded again.

## Sync Modes

- `local_first`: Default behavior. Local ledger and queue protect same-device reward trust.
- `server_authoritative`: Feature-gated behavior. The backend atomic award operation decides awarded vs skipped across devices.
- `offline_fallback`: When the backend is disabled or unavailable, local queue evidence is preserved for later inspection or reconciliation.

## Backend Result Handling

`awarded`

- The RPC inserted a backend reward event and incremented backend XP.
- The app updates local reward state and UI with `skipRemote` so it does not call the older direct XP update path again.
- The local ledger records the event as processed for same-device continuity.
- The local queue records the event as processed, or applied-unrecorded if local ledger persistence fails.

`skipped`

- The backend already has `(user_id, event_key)`.
- The app marks local dedupe state without awarding duplicate local XP.
- The local ledger records the event as processed for same-device continuity.
- The local queue records the event as skipped, or retryable if local ledger persistence fails.

`failed`

- The app marks sync-failed state for visibility.
- The local reward processor remains the fallback so the learner is not blocked by backend failure.
- Local queue state is preserved for retry/reconciliation evidence.

`disabled`

- The app uses local fallback behavior.
- This is expected for local demos, missing Supabase config, unauthenticated users, and environments where the feature flag is off.

## Reconciliation Rules

- Submit local processed ledger events to the backend through the atomic award operation, never by direct table insert.
- If the backend already has the event key, mark the local queue/ledger as reconciled and do not award XP.
- If local queue status is `applied_unrecorded`, submit evidence without replaying client XP.
- If local queue status is `pending` or `failed_retryable`, retry only when the backend is reachable and the local idempotency guards still allow it.
- If learner identity changes, do not blindly replay events under the new identity. Treat mismatched learner keys as conflicts that require a deliberate policy decision.

## Legacy Data

Existing localStorage data must stay readable:

- `rewardHistory` continues to prevent same-device duplicate XP.
- `chw-reward-event-ledger:v1:{learnerKey}` stores processed local event keys.
- `chw-reward-event-queue:v1:{learnerKey}` stores pending, failed, applied-unrecorded, skipped, processed, and reconciled queue records.

## Scaffold

`src/services/rewardSyncService.js` builds a sync plan from local ledger, local queue, and backend event snapshots. The runtime now performs feature-gated single-event backend awards, but it still does not run an automatic background queue replay loop.

## Non-Goals

- No automatic background sync in this checkpoint.
- No direct table inserts from browser code.
- No XP amount changes.
- No streak, quiz retry, or UI behavior changes.
- No broad localStorage migration.
