# Reward Backfill And Local Import Strategy

Phase 19 documents how existing local reward history can be reconciled with backend reward events later. No automatic backfill is enabled in this phase.

## Current Local Evidence

The current branch can have same-device reward evidence in:

- Legacy reward history: `chw-reward-history:{userId}`
- Local reward ledger: `chw-reward-event-ledger:v1:{learnerKey}`
- Completed lessons, quiz scores, and challenge completions

This evidence is useful for learner continuity, but it is client-controlled and should not be treated as tamper-proof proof of earned XP.

## Non-Automatic Policy

- Do not auto-import local reward history on sign-in.
- Do not silently add backend XP from localStorage.
- Do not overwrite backend XP totals based only on local data.
- Do not claim challenge completion as secure certification.

## Recommended Future Flow

A safe future import flow should be explicit:

1. Show the learner that local progress was found.
2. Explain that importing can reconcile local progress with their account.
3. Submit local reward events through `award_reward_event`, not direct table inserts.
4. Treat duplicate backend events as `skipped`.
5. Record import attempts with safe metadata such as `source = local_import`.
6. Never import raw learner code, secrets, auth tokens, or oversized metadata.

## Conflict Handling

- Backend `reward_events` wins for idempotency.
- If backend already has `(user_id, event_key)`, mark local state as reconciled later and do not add XP.
- If local history suggests an event but backend rejects it, keep local fallback behavior and surface a sync/import issue.
- If local learner key does not match the authenticated user ID, block automatic import.

## Recommended Safeguards

- Rate-limit import attempts.
- Limit event metadata size.
- Validate event types and XP amounts against current policy constants.
- Prefer user-confirmed import batches over background sync.
- Keep a clear rollback/support story before enabling import in production.

## Current Status

Backend reward events and the atomic award RPC are scaffolded. Runtime backend sync is feature-gated. Local backfill/import is documentation-only and requires a later explicit product/security decision.
