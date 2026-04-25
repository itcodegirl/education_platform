# Reward Retry and Reconciliation Plan

This document defines the Phase 8 local retry/reconciliation model for reward events. It is intentionally local-first and backend-ready, but it does not introduce Supabase reward-event writes yet.

## Current Failure Behavior

Reward processing currently has three structured failure phases:

- `ledger-read`: the local processed-event ledger could not be read or parsed.
- `apply-reward`: the XP/reward callback failed before the reward was applied.
- `ledger-write`: the reward callback completed, but the processed-event marker could not be written.

The runtime reports failures through the existing `syncFailed` path. This makes failures visible, but it does not yet preserve a retryable local record.

## Queue Lifecycle

Reward queue records should use stable event keys and move through a small set of local statuses:

- `pending`: the app intends to process this reward event.
- `processed`: the reward event is recorded in the processed ledger.
- `skipped`: the event was intentionally skipped because an idempotency guard already exists.
- `failed_retryable`: a local read/write failure occurred and the event can be retried.
- `failed_terminal`: the event is malformed or unsupported and should not be retried automatically.
- `applied_unrecorded`: XP/reward side effects completed, but the processed ledger write failed.
- `reconciled`: the queue entry was resolved by matching processed ledger or legacy reward-history evidence.

## Safety Rules

- Never replay XP for an `applied_unrecorded` event.
- Reconcile `applied_unrecorded` by writing the processed marker or finding legacy reward-history evidence.
- Use legacy reward history as a compatibility guard before local reward-event replay.
- Keep existing `syncFailed` visibility for queue and ledger failures.
- Preserve existing localStorage keys and progress data.

## Storage Strategy

Use a separate queue key from the processed ledger:

- Processed ledger: `chw-reward-event-ledger:v1:{learnerKey}`
- Retry queue: `chw-reward-event-queue:v1:{learnerKey}`

Queue items should include:

- `event`
- `legacyRewardKey`
- `status`
- `attemptCount`
- `lastAttemptAt`
- `nextRetryAt`
- `lastErrorPhase`
- `lastErrorMessage`
- `createdAt`
- `updatedAt`

## Retry Strategy

Phase 8 retries are local-only. They should:

- Retry `pending` and `failed_retryable` items when safe.
- Reconcile `applied_unrecorded` without re-awarding XP.
- Skip or reconcile items already represented by the processed ledger.
- Skip or reconcile items already represented by legacy reward history.
- Avoid user-facing UI changes; existing sync-failed visibility remains enough for this phase.

## Non-Goals

- No Supabase reward-event integration.
- No XP amount changes.
- No quiz retry behavior changes.
- No streak semantics changes.
- No UI redesign.
- No secure challenge certification claim.

