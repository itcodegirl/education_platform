# Release Checklist

Use this checklist before Netlify releases or hotfix deploys.

For the release summary, copy [docs/release-notes-template.md](./docs/release-notes-template.md) and fill in the actual deploy, artifact, Supabase, and rollback details.

## Pre-Deploy Checks

- Confirm branch, target deploy context, and commit SHA.
- Run:
  - `npm run check`
  - `npm run typecheck`
  - `npm run audit:performance`
  - `npm run check:supabase-readiness`
  - `npm run audit:reward-catalog`
  - `npm run audit:e2e-scripts`
  - `npm run audit:auth-e2e`
  - `npm run audit:staging-runbook`
  - `npm run audit:quizzes`
  - `npm run audit:content`
  - `npm run audit:performance`
  - `npm run test:e2e`
- Confirm required runtime environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_REWARD_BACKEND_SYNC_ENABLED` stays `false` unless reward backend migrations are applied and verified
  - Any server-side AI keys used by Netlify Functions
- Verify documentation is still truthful:
  - [README.md](./README.md)
  - [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)
  - [docs/repair-roadmap.md](./docs/repair-roadmap.md)

## Smoke Validation After Deploy

- Open the Netlify deploy URL and hard refresh.
- Validate auth shell loads cleanly.
- Validate core learning flow:
  - open a lesson
  - complete a lesson
  - refresh and confirm progress reloads
- Validate stale-link recovery:
  - open a `/learn/<course>/<bad-module>/<bad-lesson>` URL for a real course
  - confirm the app recovers to the first lesson in that course instead of a blank or generic error path
- Validate persistence UX:
  - create/edit a note
  - bookmark a lesson
  - open Saved lessons and confirm unavailable legacy rows are readable, disabled, and removable
- Validate quiz path for an active HTML/CSS/JS/React lesson quiz.
- If backend reward sync is enabled, validate one authenticated reward event is awarded once and repeated completion returns a skipped/duplicate result without extra XP.
- Confirm any `npm run audit:quizzes` findings are expected and documented, especially classified orphan quizzes, intentional variant groups, legacy aliases, and archived inactive quiz coverage.
- Confirm `npm run audit:content` reports zero stale prerequisite or bridge-target issues.
- Confirm package scripts still reference real Playwright projects with `npm run audit:e2e-scripts`.
- Download the Lighthouse artifact from the CI run and record the score source in the release notes before citing scores publicly.
- If touching HTML Module 102 lesson identity, verify the targeted progress/bookmark compatibility decision before release.

## PWA / Cache Validation

- Confirm install metadata shows CodeHerWay naming.
- If stale shell appears:
  1. DevTools -> Application -> Service Workers -> Unregister
  2. DevTools -> Application -> Storage -> Clear site data
  3. Reload with `Ctrl+Shift+R`

## Test Scope Reminder

- `npm run test:e2e` always covers public smoke, accessibility, visual, and first-lesson preview paths.
- Authenticated smoke checks require environment credentials and will otherwise skip.
- `npm run audit:quizzes` runs strict mode and should fail on unclassified orphan inventory, unreviewed variants, duplicate active IDs, or active lesson quiz gaps.
- `npm run audit:content` runs as a blocking learning-flow gate for prerequisite and bridge-target drift.
- `npm run audit:performance` rebuilds production assets, checks bundle budgets, and verifies heavy route boundaries for Monaco, AI tutor, PDF/canvas export, and protected app styles.
- `npm run audit:auth-e2e` runs as a static guard for authenticated smoke preflight, secret gating, and required signed-in specs/projects.
- `npm run audit:staging-runbook` keeps the live Supabase validation checklist complete; it does not replace a real staging run with credentials.
- Production-grade reliability still requires broader learning/data/a11y regression coverage.

## Release Sign-Off

- Record deployed commit SHA and Netlify deploy URL.
- Confirm no mismatch between published behavior and documented status/limitations.
- Do not label release as production-grade until roadmap hardening stages are complete.
