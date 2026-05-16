# Platform QA Release Checklist

Use this checklist for PRs that touch the admin QA report, curriculum rubric
data, authenticated smoke coverage, or Supabase-backed reliability metrics.

## Content QA Report

- Run `npm run report:content-quality -- --summary`.
- Open the admin Content QA tab and confirm the warning totals, filters, CSV
  export, suggested sprint cards, and priority fixes render correctly.
- Treat content QA warnings as report-only unless the PR explicitly changes the
  release gate. The report should guide curriculum batches without blocking
  unrelated fixes.
- When closing a curriculum batch, add the missing lesson signals directly in
  the lesson data: `learningFrame.learn`, `learningFrame.check`,
  `learningFrame.next`, `commonMistakes`, and `bridge.preview`.

## Supabase Migration Helper

- Apply `supabase-schema.sql` to the staging Supabase project before expecting
  admin reliability metrics, reward events, snapshots, or learner progress sync
  to reflect live data.
- After applying SQL, run the existing Supabase readiness checks:
  `npm run check:supabase-readiness` and the relevant staging validation steps
  in `docs/staging-supabase-validation.md`.
- Do not put Supabase service keys in browser or Vite-prefixed environment
  variables. Service-role access belongs only in trusted scripts or functions.

## Authenticated E2E Readiness

- Configure the four GitHub Secrets before treating CI as signed-in coverage:
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `E2E_EMAIL`, and
  `E2E_PASSWORD`.
- Run `npm run test:e2e:auth:preflight` before authenticated Playwright smoke.
- Run `npm run test:e2e:smoke:authenticated` only after the preflight passes.
- A skipped authenticated E2E job is a known limitation, not a signed-in pass.

## PR Validation

- Run the focused unit/component tests for the touched QA files.
- Run `npm run audit:content`, `npm run audit:auth-e2e`, and
  `npm run check-package-scripts` when the PR changes reports, docs, or scripts.
- Run `npm run build` and `npm run check:bundle` before opening the PR.
- Create a Netlify draft deploy first, verify the preview URL, then promote only
  after the branch checks and manual QA are clean.

## Stacked Branch Notes

This QA workflow branch builds on the earlier admin QA and action-plan branches.
Merge the stack in order so the report tab, generated report command, and
priority planning helpers exist before this checklist and filter UI land.
