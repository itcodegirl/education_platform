# Reward Sync Strategy

This document describes the current reward sync behavior after the Supabase backend reward checkpoint.

## Current Runtime Strategy

Local reward behavior remains the default and fallback path.

Backend reward sync is attempted only when all of these are true:

- The learner is authenticated.
- Supabase browser config is available.
- `VITE_REWARD_BACKEND_SYNC_ENABLED=true`.
- The reward runtime has a stable learner-scoped event key.

If any condition is missing, rewards continue through the local reward-event ledger and legacy reward-history guard.

## Backend Result Handling

`awarded`

- The RPC inserted a backend reward event and incremented backend XP.
- The app updates local reward state and UI with `skipRemote` so it does not call the older direct XP update path again.
- The local ledger records the event as processed for same-device continuity.

`skipped`

- The backend already has `(user_id, event_key)`.
- The app marks local dedupe state without awarding duplicate local XP.
- The local ledger records the event as processed for same-device continuity.

`failed`

- The app marks sync-failed state for visibility.
- The local reward fallback remains available so the learner is not blocked by backend failure.
- A durable retry queue is still future work on this branch.

`disabled`

- The app silently uses local fallback behavior.
- This is expected for local demos, missing Supabase config, unauthenticated users, and environments where the feature flag is off.

## Local Fallback Preservation

The backend checkpoint does not remove or overwrite:

- Legacy reward history keys
- Local reward-event ledger records
- Existing localStorage progress behavior
- Existing quiz retry semantics
- Existing streak semantics
- Existing XP amounts

This preserves current demos and avoids a broad migration.

## Cross-Device Trust Boundary

When enabled and validated, the backend path gives cross-device idempotency for new reward events because the database enforces a unique `(user_id, event_key)` constraint.

It does not automatically prove or import older local rewards. Existing local reward history is client-controlled and needs a separate explicit import policy before being trusted as backend XP.

## Missing Durability Layer

This branch does not include the retry/reconciliation engine from `feat/reward-retry-reconciliation`.

Still needed later:

- Durable pending/failed reward event queue
- Reconciliation between local ledger and backend events
- Developer diagnostics for reward-event health
- Explicit local import/backfill UX and policy
- Live Supabase integration tests against a configured project

## Recommended Next Step

Pause backend reward work after this checkpoint unless the team is ready to apply migrations to a real Supabase project. The next safe implementation phase should be live validation of `reward_events`, RLS, and `award_reward_event()` before turning on backend sync for any real users.
