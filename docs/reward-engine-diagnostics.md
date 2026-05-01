# Reward Engine Diagnostics

Phase 12 adds dev-safe diagnostics for the local reward engine. These diagnostics are designed for debugging and support workflows, not for user-facing UI redesign.

## What Diagnostics Report

- Local reward ledger read status.
- Processed reward key count.
- Local reward queue read status.
- Queue item counts by status.
- Warnings for retryable failures, applied-unrecorded rewards, terminal failures, or unreadable storage.
- Whether backend reward events are enabled. This is currently `false`.

Diagnostics intentionally avoid:

- Secrets or auth tokens.
- Raw learner code.
- Full event metadata dumps.
- Automatic mutation of reward state.

## Health Statuses

- `ok`: local ledger and queue are readable and no attention-needed queue states are present.
- `needs_attention`: local storage is readable, but pending failure/reconciliation states exist.
- `unavailable`: local ledger or queue storage cannot be read or parsed.

## Current Scope

`src/engine/rewards/rewardDiagnostics.js` reads the existing local ledger and queue and returns a structured summary. It does not call Supabase, retry events, or change XP. The goal is to make reward trust issues inspectable while backend reward-event support remains planned.
