# Reward Cross-Device Sync Strategy

This Phase 11 strategy defines how local reward state should later reconcile with server reward state. It is a scaffold only: the current runtime still uses local reward ledger/queue behavior and does not automatically sync reward events to Supabase.

## Sync Modes

- `local_first`: Current behavior. Local ledger and queue protect same-device reward trust.
- `server_authoritative`: Future behavior. The backend atomic award operation decides awarded vs skipped across devices.
- `offline_fallback`: When the backend is unavailable, local queue evidence is preserved for later reconciliation.

## Sync Rules

- Submit local processed ledger events to the backend through the atomic award operation, never by direct table insert.
- If the backend already has the event key, mark the local queue/ledger as reconciled and do not award XP.
- If local queue status is `applied_unrecorded`, submit evidence without replaying client XP.
- If local queue status is `pending` or `failed_retryable`, retry only when the backend is reachable and the local idempotency guards still allow it.
- If learner identity changes, do not blindly replay events under the new identity. Treat mismatched learner keys as conflicts that require a deliberate policy decision.

## Conflict Resolution Policy

- Backend duplicate event wins for idempotency: return skipped and reconcile local state.
- Local `applied_unrecorded` evidence should become a backend event if the atomic operation accepts it.
- Local malformed or unsupported events should remain terminal locally and should not be submitted.
- Legacy localStorage reward history remains a compatibility signal, but backend events become the source of truth after server sync is enabled.
- Challenge completion remains a learner-motivation signal, not secure certification.

## Legacy Data

Existing localStorage data must stay readable:

- `rewardHistory` continues to prevent same-device duplicate XP.
- `chw-reward-event-ledger:v1:{learnerKey}` stores processed local event keys.
- `chw-reward-event-queue:v1:{learnerKey}` stores pending, failed, applied-unrecorded, skipped, processed, and reconciled queue records.

## Scaffold

`src/services/rewardSyncService.js` builds a sync plan from local ledger, local queue, and backend event snapshots. It is not invoked by runtime yet. The plan is intended to make the future backend integration reviewable before any data-writing sync loop is enabled.

## Non-Goals

- No automatic background sync in this phase.
- No Supabase writes in this phase.
- No XP amount changes.
- No streak, quiz retry, or UI behavior changes.
- No broad localStorage migration.
