# Supabase Reward Backend Architecture Audit

Phase 13 audits the current branch before introducing the server-authoritative reward layer. This branch is the source of truth for the backend phase.

## Branch Reality

The commits from `feat/reward-retry-reconciliation` are present in the local git object database, but they are not merged into this branch and are not merged into `main`.

Unmerged commits checked:

- `6891078 docs(progress): design reward retry lifecycle`
- `5292b72 feat(progress): add reward retry queue storage`
- `a448fc4 fix(progress): reconcile failed reward events safely`
- `14eed88 feat(progress): add reward retry queue`
- `874efa8 docs(progress): document reward retry queue checkpoint`
- `4b0e33a docs(progress): design backend reward event schema`
- `19c7093 docs(progress): document atomic reward award operation`
- `9b99337 feat(progress): scaffold reward sync service`
- `011c24d feat(progress): add reward engine diagnostics`

Missing prior-phase artifacts found at the start of this branch:

- `src/services/rewardEventService.js`
- `src/engine/rewards/rewardQueue.js`
- `src/engine/rewards/rewardReconciliation.js`
- `src/engine/rewards/rewardDiagnostics.js`
- Backend reward-event design docs from the retry branch

For this Supabase backend phase, only backend-facing service, SQL, and documentation pieces should be recreated. The full retry/reconciliation queue and diagnostics engine are not recreated here unless a later backend phase directly needs them.

Phase checkpoint update: `src/services/rewardEventService.js` has now been recreated additively for the Supabase backend path. The retry queue, reconciliation helpers, and diagnostics utilities from `feat/reward-retry-reconciliation` remain unmerged and intentionally absent from this branch.

## Supabase Files Found

- `src/lib/supabaseClient.js`
- `src/services/progressService.js`
- `src/services/authService.js`
- `src/services/auditLogService.js`
- `src/services/practiceService.js`
- `src/integration/supabase-policy.test.js`
- `supabase-schema.sql`
- `.env.example`

There is no `supabase/` project directory and no existing `supabase/migrations/` migration convention in this branch.

## Environment Variables

Browser-safe variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only variables:

- `SUPABASE_SERVICE_KEY`
- `STREAK_REMINDER_SECRET`

The service-role key is already documented as server-only and must not be used in browser code.

## Auth Assumptions

- The app uses Supabase Auth through `src/lib/supabaseClient.js`.
- Client code relies on the anon key plus RLS policies.
- Current authenticated writes use `auth.uid()`-protected table policies.
- Integration policy tests use `SUPABASE_SERVICE_KEY` only in test/runtime context, not browser code.

## Existing Backend Tables

The root schema defines:

- `profiles`
- `progress`
- `quiz_scores`
- `xp`
- `streaks`
- `daily_goals`
- `badges`
- `sr_cards`
- `bookmarks`
- `notes`
- `courses_visited`
- `last_position`
- `analytics_events`
- admin/audit/rate-limit/public-profile support tables and RPCs later in the schema

The existing `xp` table has:

- `user_id uuid primary key`
- `total integer default 0`
- `updated_at timestamptz default now()`

This is the safest initial backend XP total target because it preserves current `progressService.updateXP()` and dashboard/public-profile reads.

## Existing Reward Architecture

This branch currently has:

- Local reward event types and stable learner-scoped event keys in `src/engine/rewards/`.
- A local reward ledger stored in localStorage.
- A local reward processor/runtime used by lesson, quiz, and challenge flows.
- Legacy reward history as the first same-device compatibility guard.

At Phase 13, this branch did not have:

- Local reward retry queue.
- Reward reconciliation helpers.
- Reward diagnostics.
- Backend reward service wrapper.

By the Phase 20 checkpoint, the backend reward service wrapper exists. The local retry queue, reconciliation helpers, and diagnostics utilities still do not exist on this branch.

## Recommended Backend Reward Strategy

- Keep local reward behavior as the default and fallback path.
- Add backend SQL additively, without applying destructive schema changes.
- Use the existing `xp` table as the canonical backend total for now.
- Add `reward_events` with a unique `(user_id, event_key)` idempotency constraint.
- Add an `award_reward_event` RPC that derives `user_id` from `auth.uid()`, inserts the event, and increments `xp.total` in one transaction.
- Add a frontend service wrapper that returns `disabled` when Supabase config/client/auth is unavailable.
- Gate runtime backend sync behind a `VITE_REWARD_BACKEND_SYNC_ENABLED` feature flag and preserve local fallback behavior.

## Risks And Non-Goals

- No live Supabase project config is available in-repo, so SQL can be committed but not applied here.
- Because there is no existing migration directory, this phase will add a documented migration convention rather than running migrations.
- Existing browser code imports `supabaseClient.js`, which currently throws when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing; backend reward service code must avoid making demo/offline mode worse.
- Do not use service-role keys in browser code.
- Do not change XP amounts, quiz retry behavior, streak semantics, UI, or local reward behavior.
- Do not recreate the unmerged retry/reconciliation engine as part of this backend phase.

## Phase 13-20 Plan

Phase 13: Commit this architecture audit and plan.

Phase 14: Add a `reward_events` migration SQL file with RLS, indexes, and read-only direct client access.

Phase 15: Use the existing `xp` table as the backend XP total table and document why no `learner_progress` table is needed yet.

Phase 16: Add an `award_reward_event` RPC migration that performs idempotent event insert plus XP increment in one transaction.

Phase 17: Recreate `src/services/rewardEventService.js` as a backend-facing wrapper with `awarded`, `skipped`, `failed`, and `disabled` results.

Phase 18: Feature-gate backend reward sync in the local reward runtime so local behavior remains the default fallback.

Phase 19: Document local reward backfill/import strategy without auto-backfilling user data.

Phase 20: Update public docs and run final validation.
