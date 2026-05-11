# Atomic Reward Award Operation

The local reward retry/reconciliation branch and the Supabase backend reward branch are now unified. This document describes the backend atomic award contract and how the runtime uses it only when explicitly enabled.

## Purpose

`public.award_reward_event()` is the server-authoritative reward path. It prevents duplicate XP across devices by using `public.reward_events` as the idempotency ledger, `public.reward_catalog` as the server-owned reward allowlist, and `public.xp` as the aggregate XP total.

The current hardened path also uses `public.reward_catalog` to derive the canonical event key prefix and XP amount on the server. The browser sends the event type, entity id, metadata, and source; legacy `p_event_key` and `p_xp_amount` inputs remain accepted only as compatibility checks and are rejected if they do not match the catalog-derived values.

The local reward ledger, queue, diagnostics, and legacy reward history remain the default and fallback behavior.

## Input

- `p_event_type text`
- `p_entity_id text`
- `p_metadata jsonb default '{}'`
- `p_source text default 'client'`
- Optional compatibility fields: `p_event_key text`, `p_xp_amount integer`

The function never accepts `user_id` from the client. It derives the learner from `auth.uid()`, derives the canonical event key from the learner and entity, and derives XP from `public.reward_catalog`. Older callers may still pass `p_event_key` or `p_xp_amount`, but mismatches are rejected.

## Result

The function returns JSON with:

- `status`: `awarded`, `skipped`, or `failed`
- `event_key`
- `xp_awarded`
- `total_xp`
- `reason` when failed

The frontend wrapper normalizes those results, plus local configuration states, into:

- `awarded`
- `skipped`
- `failed`
- `disabled`

## Behavior

- Reject unauthenticated calls.
- Reject missing event types.
- Reject missing entity IDs.
- Reject event/entity pairs that are not active in `public.reward_catalog`.
- Reject client-supplied event keys that do not match the server-derived key.
- Reject client-supplied XP amounts that do not match the server catalog.
- Insert `reward_events(user_id, event_key, ...)` if it does not already exist.
- Increment `xp.total` only when the reward event insert succeeds.
- Return `skipped` with the current backend XP total when `(user_id, event_key)` already exists.

## Required Properties

- The unique `(user_id, event_key)` constraint is the backend idempotency guard.
- XP and reward-event insert must happen in the same transaction.
- The function must never double-award the same backend event key.
- Browser code must not be trusted to choose XP values or invent rewardable entity IDs.
- Metadata must stay small and safe: no auth tokens, secrets, or raw learner code.
- Browser code must not use a service-role key.

## Runtime Integration

Backend reward sync runs only when:

- The learner is authenticated.
- `VITE_REWARD_BACKEND_SYNC_ENABLED=true`.
- The runtime has a stable learner-scoped event key.
- Supabase browser config and the RPC are available.

Before attempting a backend award, the runtime still checks the local reward ledger for an already processed event. This preserves same-device dedupe and avoids double-awarding when local state already recorded the reward.

When the backend returns `awarded`, the app updates local UI/state with `skipRemote` so it does not call the older direct XP update path again. The local ledger and queue are updated for same-device continuity.

When the backend returns `skipped`, the app marks local dedupe state and local queue state without awarding duplicate local XP.

When the backend returns `failed` or `disabled`, local reward processing remains the fallback and local queue evidence is preserved for inspection or later reconciliation.

## Non-Goals

- No XP amount changes.
- No quiz retry or streak semantic changes.
- No localStorage migration.
- No automatic local reward import/backfill into Supabase yet.
- No background queue replay to the backend yet.
