# Release Checklist

Use this checklist before Netlify releases or hotfix deploys.

## Pre-Deploy Checks

- Confirm branch, target deploy context, and commit SHA.
- Run:
  - `npm run build`
  - `npm run audit:quizzes`
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
- Validate persistence UX:
  - create/edit a note
  - bookmark a lesson
- Validate quiz path for an active HTML/CSS/JS/React lesson quiz.
- If backend reward sync is enabled, validate one authenticated reward event is awarded once and repeated completion returns a skipped/duplicate result without extra XP.
- Confirm any `npm run audit:quizzes` findings are expected and documented, especially classified orphan quizzes, intentional variant groups, legacy aliases, and deferred Python quiz coverage.
- If touching HTML Module 102 lesson identity, verify the targeted progress/bookmark compatibility decision before release.

## PWA / Cache Validation

- Confirm install metadata shows CodeHerWay naming.
- If stale shell appears:
  1. DevTools -> Application -> Service Workers -> Unregister
  2. DevTools -> Application -> Storage -> Clear site data
  3. Reload with `Ctrl+Shift+R`

## Test Scope Reminder

- `npm run test:e2e` always covers public smoke path.
- Authenticated smoke checks require environment credentials and will otherwise skip.
- `npm run audit:quizzes` should remain report-only until strict-mode criteria are defined for classified orphan inventory, intentional variants, aliases, and Python policy decisions.
- Production-grade reliability still requires broader learning/data/a11y regression coverage.

## Release Sign-Off

- Record deployed commit SHA and Netlify deploy URL.
- Confirm no mismatch between published behavior and documented status/limitations.
- Do not label release as production-grade until roadmap hardening stages are complete.
