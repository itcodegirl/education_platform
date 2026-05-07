# PR Title

Harden education platform sync paths and document backend readiness boundary

# PR Description

## Summary

This PR hardens learning-platform safety paths and documents the backend reward sync release boundary. It does not enable backend reward sync globally and does not claim production readiness.

## Current Hardening Update

- Authenticated learner E2E now has a CI preflight that requires these GitHub Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `E2E_EMAIL`, and `E2E_PASSWORD`.
- Local authenticated E2E can still skip when those values are intentionally absent. CI jobs set `E2E_AUTH_REQUIRED=true` only when the full secret set is present; once required, placeholder Supabase config, invalid URLs, or unreachable Supabase hosts fail clearly before Playwright runs.
- Playwright already records `trace: retain-on-failure`, `screenshot: only-on-failure`, and `video: retain-on-failure`; CI now uploads `playwright-report/` and `test-results/` artifacts with 7-day retention for failed-run inspection.
- Reward backend idempotency now has an additive migration guard for `(user_id, event_key)` plus static SQL checks that verify auth-derived ownership and duplicate-award prevention. Live Supabase validation is still required before enabling backend reward sync outside staging.
- `npm audit --omit=dev` identified `dompurify` via `monaco-editor`; the override is updated to the patched `dompurify` range.
- The repository canonicalization checklist conflict markers were resolved without doing repo-admin rename work.

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

- `npm.cmd install --package-lock-only`
- `npm.cmd audit`
- `npm.cmd audit --omit=dev`
- `npm.cmd run lint`
- `npm.cmd run check:js-source`
- `npm.cmd run build`
- `npm.cmd run check:bundle`
- `npm.cmd run check`
- `npm.cmd test`
- `npm.cmd run audit:quizzes`
- `npm.cmd run test:run -- src/integration/supabase-policy-static.test.js src/services/rewardEventService.test.js src/services/rewardSyncService.test.js src/engine/rewards/rewardRuntime.test.js`
- `npm.cmd run test:e2e:auth:preflight` locally skips when credentials are absent.
- `E2E_AUTH_REQUIRED=true npm.cmd run test:e2e:auth:preflight` fails clearly when credentials are absent.
- `npm.cmd run test:e2e:smoke:learning` locally skips when credentials are absent.
- `E2E_AUTH_REQUIRED=true npm.cmd run test:e2e:smoke:learning` fails clearly when credentials are absent.
- `npm.cmd run test:e2e:smoke:public` passed against a temporary local dev server on an alternate port.
- `npx playwright test tests/e2e/public.visual.spec.js --project=chromium --project=mobile-chrome` passed; no `360x780` snapshot updates were needed.
- `npx playwright test` passed for the locally runnable public surface; authenticated tests skipped locally because credentials are absent.
- `npm.cmd run test:policy` skipped because live Supabase policy credentials are absent.
- `git diff --check`

Direct PowerShell `npm run test:unit`, `npm run lint`, and `npm run check:js-source` may be blocked by local `npm.ps1` execution policy on this machine; the same package scripts pass through `npm.cmd`.

## What Was Not Live-Validated

- The backend sync migration was not applied to a real Supabase staging project.
- No authenticated staging learner completed lesson, quiz, challenge, duplicate reward, daily/streak, or offline replay flows.
- No staging database rows were inspected for `reward_events`, `challenge_completions`, or `daily_activity_events`.
- RLS behavior, reward RPC auth ownership, and duplicate-award handling were statically reviewed only, not executed against staging.
- Authenticated mobile coverage remains dependent on healthy Supabase E2E credentials in CI.
- Visual snapshots at `360x780` remain platform-sensitive and should only be updated after reviewing generated diff artifacts, not blindly accepted.
- The current Monaco bundle budget passes without lowering budgets; keep watching the lazy Monaco chunks because they remain close to the explicit 1900 kB editor budget.
- Repo name/canonicalization settings remain manual GitHub/profile administration outside this code PR unless a broken in-repo reference is found.

## Inspecting E2E Artifacts

For failed GitHub Actions E2E runs, open the uploaded artifact named `playwright-e2e-smoke-<run>-<attempt>` or `playwright-check-ci-<run>-<attempt>`. Use `playwright-report/index.html` for the HTML report and `test-results/` for retained traces, screenshots, and videos.

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
