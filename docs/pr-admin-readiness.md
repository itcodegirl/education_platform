# PR Admin Readiness Checklist

Use this checklist for PRs that touch authenticated E2E, Supabase migrations, or bundle budgets. It keeps admin-only follow-through explicit without baking secrets or environment-specific assumptions into the codebase.

## Branch Hygiene

Before committing or pushing, confirm you are on the intended branch and the working tree only contains the files for the current task:

```bash
git status --short --branch
git log --oneline --decorate -5
```

For PR #37, the target head branch is:

```text
codex/education-platform-hardening
```

Do not stage unrelated local UI/content edits while updating CI or Supabase hardening files.

## GitHub CLI Auth

The GitHub connector can update PR metadata, but local CI/log workflows are easier when `gh` is authenticated:

```bash
gh auth status
gh auth login -h github.com
```

If `gh auth status` reports an invalid token, re-authenticate before relying on `gh run`, `gh pr`, or `gh secret` commands.

## Authenticated E2E Secrets

Add the authenticated learner E2E secrets through the GitHub UI or CLI. Do not print values in logs.

```bash
gh secret set VITE_SUPABASE_URL
gh secret set VITE_SUPABASE_ANON_KEY
gh secret set E2E_EMAIL
gh secret set E2E_PASSWORD
```

The values must point to the same Supabase E2E project and a dedicated test learner account.

After secrets are configured, rerun the PR checks from the GitHub Actions UI or with `gh run rerun` after local auth is healthy.

## Supabase Reward Sync Validation

Backend reward sync remains gated until staging validation is complete:

- Apply the migrations in `supabase/migrations/`.
- Run the live checklist in `docs/staging-supabase-validation.md`.
- Record reward event idempotency, duplicate-award behavior, RLS isolation, and offline/replay results.
- Keep `VITE_REWARD_BACKEND_SYNC_ENABLED=false` outside staging until validation passes.

## Monaco Bundle Budget Policy

The current budget policy is:

- Monaco editor chunks stay lazy.
- `dist/index.html` must not modulepreload `vendor-monaco-*` chunks.
- The lazy Monaco editor chunk budget is intentionally separate from the main app budget.

Do not change the Monaco budget only to turn CI green. If a stricter budget fails, either split Monaco more cleanly or document the accepted budget change in a dedicated performance PR.

## Playwright Failure Triage

If E2E fails after secrets are configured:

1. Download the uploaded `playwright-*` artifact from the failed workflow run.
2. Open `playwright-report/index.html`.
3. Inspect `test-results/` traces, screenshots, and videos.
4. Fix the observed failure before updating snapshots or changing skip behavior.
