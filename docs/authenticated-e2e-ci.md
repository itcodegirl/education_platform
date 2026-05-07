# Authenticated E2E CI Setup

Authenticated learner Playwright coverage is supported in CI for this repository. Public smoke, build, unit, policy, and Lighthouse checks still run without credentials. Authenticated E2E runs only when the complete secret set is present, so CI does not imply signed-in coverage unless the preflight says it ran.

## Required GitHub Secrets

Add these under GitHub repository settings -> Secrets and variables -> Actions -> Repository secrets:

| Secret | Notes |
| --- | --- |
| `VITE_SUPABASE_URL` | E2E Supabase project URL, for example `https://project-ref.supabase.co`. |
| `VITE_SUPABASE_ANON_KEY` | Anon key for the same E2E Supabase project. This is browser-public but should still be managed as a CI secret to avoid accidental placeholder drift. |
| `E2E_EMAIL` | Dedicated learner test account email. Do not use a real learner account. |
| `E2E_PASSWORD` | Password for the dedicated learner test account. |

Do not store these as workflow defaults or print them in logs. The CI preflight redacts host and credential values.

## Expected CI Behavior

- `E2E_AUTH_REQUIRED=true` is set only when all four required secrets are present.
- Missing or partial secrets skip authenticated Playwright coverage and keep public CI checks running.
- Invalid Supabase URLs fail before Playwright runs.
- Localhost Supabase URLs and the placeholder anon key fail in CI unless a job explicitly sets `E2E_ALLOW_LOCAL_SUPABASE=true`.
- Unreachable Supabase hosts fail with a redacted reason.
- Authenticated tests may still skip locally when credentials are absent.

Treat a skipped authenticated E2E run as a known limitation, not as a signed-in test pass.

## Artifact Inspection

On failed E2E runs, download the workflow artifact named one of:

- `playwright-e2e-smoke-<run-id>-<attempt>`
- `playwright-check-ci-<run-id>-<attempt>`

Open `playwright-report/index.html` for the report. Retained traces, screenshots, and videos live under `test-results/` when Playwright captures them on failure.

## Readiness Gates

Run the static Supabase readiness gate before enabling persistence-sensitive features:

```bash
npm run check:supabase-readiness
```

See [Supabase Production Readiness](./supabase-production-readiness.md) for migration order, SQL inspection queries, and the backend reward sync boundary.

## Backend Reward Sync Boundary

The authenticated learner account verifies the browser flow only. Backend reward sync still requires the Supabase migrations in `supabase/migrations/` and the staging validation checklist in `docs/staging-supabase-validation.md` before `VITE_REWARD_BACKEND_SYNC_ENABLED=true` is used beyond staging.
