# Backend Reward Events Design

This Phase 9 design prepares CodeHerWay for server-authoritative reward tracking without changing production reward behavior yet. The current app still uses the local reward ledger, queue, and legacy reward history as same-device guards.

## Goals

- Store reward events with stable event keys so duplicate XP cannot be awarded across devices.
- Preserve the existing `xp` table as the learner-facing total while moving idempotency to `reward_events`.
- Keep enough metadata to debug reward history without storing secrets or oversized payloads.
- Support local-first reconciliation from the existing local reward-event ledger.

## Proposed Table

`public.reward_events`

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | `uuid` | Primary key for the event row. |
| `user_id` | `uuid` | Supabase authenticated learner. |
| `event_key` | `text` | Stable idempotency key, unique per learner. |
| `event_type` | `text` | Reward type such as `LESSON_COMPLETE`, `QUIZ_BASE`, `QUIZ_PERFECT`, or `CHALLENGE_COMPLETE`. |
| `entity_id` | `text` | Lesson ID, quiz key, or challenge ID. |
| `xp_amount` | `integer` | XP intended for the event. |
| `metadata` | `jsonb` | Safe context such as course ID, score, source, or client ledger timestamp. |
| `status` | `text` | `pending`, `processed`, `skipped`, `failed`, or `reconciled`. |
| `source` | `text` | Source runtime such as `web-local-ledger`, `web-retry-queue`, or future server process. |
| `client_event_id` | `text` | Optional client-generated event key or trace ID. |
| `client_created_at` | `timestamptz` | Optional timestamp from the local ledger. |
| `created_at` | `timestamptz` | Server insert timestamp. |
| `processed_at` | `timestamptz` | Server processing timestamp. |
| `updated_at` | `timestamptz` | Last status update timestamp. |

## Constraints

- `unique(user_id, event_key)` is the cross-device idempotency guard.
- `event_type` should be constrained to known reward event types.
- `status` should be constrained to known backend statuses.
- `xp_amount` should be non-negative.
- `metadata` should default to `{}` and should not contain secrets, auth tokens, or raw learner code.

## RLS Plan

- Learners can select their own reward events.
- Learners should not directly insert arbitrary processed reward events once the server-side atomic award operation exists.
- During a transition period, inserts may be allowed only through a security-definer RPC that validates `auth.uid()`, event type, XP amount, and idempotency.
- Admin read access can follow the existing `is_admin()` pattern used by analytics events.

## Migration And Backfill Strategy

- Add the table and indexes without changing frontend behavior.
- Ship the atomic award RPC as the only production writer.
- Keep local ledger/queue as the offline fallback until sync is implemented.
- Backfill can read local reward ledger events when a learner signs in on a device and submit them through reconciliation, not by direct table inserts.
- If the server already has a row for `event_key`, local reconciliation should mark the local queue/ledger as reconciled and skip XP.
- If local history says XP was already awarded but the backend has no event, reconciliation should create a backend event with `source = 'web-local-ledger-backfill'` and no extra XP unless the atomic operation verifies the XP total also needs repair.

## Non-Goals

- No Supabase runtime integration in this phase.
- No XP amount changes.
- No localStorage data migration.
- No change to quiz retry, streak, lesson, or challenge behavior.
- No secure certification claim for challenge completion.
