# PR Title

Harden education platform sync paths and document backend readiness boundary

# PR Description

## Summary

This PR hardens learning-platform safety paths and documents the backend reward sync release boundary. It does not enable backend reward sync globally and does not claim production readiness.

## What Changed

- Hardened profile flag and challenge sandbox behavior.
- Added reduced-data editor fallback for code preview and challenge editing.
- Improved quiz choice accessibility labels for selected/correct/incorrect states.
- Guarded quiz submission against double-click duplicate XP awards and covered lesson/quiz duplicate-award paths.
- Extracted learn-route action handling into `src/routes/learnRouteActions.js`.
- Expanded reference search indexing to include structured lesson fields and glossary terms.
- Kept lesson progress loading resilient when the notes table fails.
- Covered offline retry copy so backend-disabled users get a single-device progress warning.
- Added tests for recoverable progress loading and lesson write behavior.
- Updated backend reward sync documentation to match the feature-gated RPC payload and authenticated-load replay behavior.
- Added the learning-engine backend trust contract and staging Supabase validation runbook.
- Ignored unrelated generated or external folders in lint and JS source-policy checks.

## What Was Locally Validated

- `npm run build`
- `npm.cmd run test:unit`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `git diff --check`

Direct PowerShell `npm run test:unit`, `npm run lint`, and `npm run typecheck` may be blocked by local `npm.ps1` execution policy on this machine; the same package scripts pass through `npm.cmd`.

## What Was Not Live-Validated

- The backend sync migration was not applied to a real Supabase staging project.
- No authenticated staging learner completed lesson, quiz, challenge, duplicate reward, daily/streak, or offline replay flows.
- No staging database rows were inspected for `reward_events`, `challenge_completions`, or `daily_activity_events`.
- RLS behavior and RPC learner mismatch rejection were statically reviewed only, not executed against staging.

## Exact Blocker

There is no usable Supabase staging access in this workspace. `.env.local` is ignored and contains placeholder credentials, the Supabase CLI is unavailable, and no staging test learner or project access token is available.

## Not Production Ready Yet

Backend sync must remain limited to staging or local until:

- Migration is applied to Supabase.
- Real authenticated learner test passes.
- Duplicate reward test passes.
- Offline/online replay test passes.
- Challenge cross-session sync passes.
- Daily/streak reconciliation passes.

## Production Readiness Recommendation

Do not enable `VITE_REWARD_BACKEND_SYNC_ENABLED` globally for production. Keep the feature flag scoped to local or staging and complete `docs/staging-supabase-validation.md` before broader rollout.
