# Atomic Reward Award Operation

This Phase 10 design defines the future server-authoritative reward award operation. It is not connected to the current runtime yet. The app continues to use the local reward ledger, retry queue, and legacy reward history.

## Contract

`award_reward_event(payload)` should perform one trusted transaction:

1. Validate the authenticated user.
2. Validate the event type, entity ID, stable event key, and XP amount.
3. Insert `reward_events(user_id, event_key, ...)` only if the user/event key does not already exist.
4. Award XP in `public.xp` only when the insert succeeds.
5. Return a structured result:
   - `awarded`: event inserted and XP applied.
   - `skipped`: event key already existed, so no XP was applied.
   - `failed`: validation, auth, or database failure.

## Required Properties

- The unique `(user_id, event_key)` constraint is the idempotency guard.
- XP and reward-event insert must happen in the same transaction.
- The function must never double-award the same event key.
- The function should be the only production writer for processed backend reward events.
- Metadata must stay small and safe: no auth tokens, secrets, or raw learner code.

## Offline And Backend-Unavailable Behavior

- Current local-first reward processing remains the fallback.
- If the backend is unavailable, the local reward queue can keep `pending`, `failed_retryable`, or `applied_unrecorded` evidence.
- When backend sync is introduced, reconciliation should submit local events through the atomic operation, not by directly inserting rows.
- If the backend returns `skipped`, the local ledger/queue can be marked reconciled without awarding XP again.

## Frontend Service Stub

`src/services/rewardEventService.js` defines an unused wrapper contract for calling the future RPC. It requires an injected Supabase-like client so importing it does not require environment variables and does not change runtime behavior.

## Non-Goals

- No production Supabase RPC call path is enabled in this phase.
- No XP amount changes.
- No quiz retry or streak semantics changes.
- No localStorage migration.
