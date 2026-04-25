# Atomic Reward Award Operation

Phase 16 introduces the SQL contract for `public.award_reward_event()`.

## Purpose

The RPC is the future server-authoritative reward path. It prevents duplicate XP across devices by using `public.reward_events` as the idempotency ledger and `public.xp` as the aggregate XP total.

## Input

- `p_event_key text`
- `p_event_type text`
- `p_entity_id text`
- `p_xp_amount integer`
- `p_metadata jsonb default '{}'`
- `p_source text default 'client'`

The function never accepts `user_id` from the client. It derives the learner from `auth.uid()`.

## Result

The function returns JSON with:

- `status`: `awarded`, `skipped`, or `failed`
- `event_key`
- `xp_awarded`
- `total_xp`
- `reason` when failed

## Behavior

- Reject unauthenticated calls.
- Reject missing event keys.
- Reject unsupported reward event types.
- Reject missing entity IDs.
- Reject XP amounts less than or equal to zero.
- Insert `reward_events(user_id, event_key, ...)` if it does not already exist.
- Increment `xp.total` only when the reward event insert succeeds.
- Return `skipped` with the current backend XP total when `(user_id, event_key)` already exists.

## Security Choice

The function uses `security definer` because direct browser insert/update policies are intentionally not added for `reward_events` or backend XP mutation. This keeps the write path narrow:

- Browser code can execute only the RPC as an authenticated user.
- The RPC derives identity from `auth.uid()`.
- The RPC validates event type and XP amount.
- The service-role key is not used in browser code.

## Runtime Status

The RPC migration exists, but frontend reward flows are not wired to it until the feature-gated backend sync phase. Local reward behavior remains the default fallback.
