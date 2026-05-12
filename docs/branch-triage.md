# Branch And PR Triage

Last reviewed: May 12, 2026.

This note keeps the repo review path clear while older branches still exist. Treat it
as a point-in-time map, not a product roadmap.

## Current State

- Default branch: `main`.
- Open PRs:
  - `#90` `codex/security-trust-hardening` — CI dependency fixes plus learner-trust /
    navigation polish (sidebar mobile a11y, copy accuracy, quiz duplicate-XP guard via
    `legacyQuizKeys`). Review against the same areas in `#92`.
  - `#92` `claude/audit-codherway-platform-vV69f` — May 2026 portfolio audit
    (`docs/portfolio-audit-2026-05.md`) plus the high-priority fixes that came out of
    it (broken-`main` repair, public-copy alignment, this triage refresh, lesson-format
    audit gate, reward trust-boundary UI, dead-file cleanup).

If `#90` and `#92` both touch the same file, merge `#92`'s broken-`main` repair first
(`src/data/reference/search-index.js`, `src/components/panels/BookmarksPanel.jsx`),
then rebase the other.

## Stale Remote Branches (cleanup candidates)

These remote branches are bot/audit output or superseded WIP and are not merge
candidates. Delete them once their content is confirmed represented in `main`:

- `copilot/audit-education-platform`
- `copilot/close-open-branches`
- `copilot/explore-codebase-implementation-plan`
- `copilot/full-project-audit-review`
- `copilot/full-project-audit-review-again`
- `codex/learner-journey-hardening`
- `codex/production-readiness-continuation-20260511`
- `codex/public-profile-retry-resilience-20260511`

Recommended handling: `git fetch --prune`, diff each against `main`, cherry-pick any
small still-relevant patch into a fresh `codex/*` or `claude/*` branch, run
`npm run check`, then delete the stale remote.

## Backend Reward Sync Branches

Any branch that touches backend reward sync, Supabase reward migrations, or
`VITE_REWARD_BACKEND_SYNC_ENABLED` stays parked until the migrations can be applied
against a real Supabase project and authenticated duplicate-award tests can run. The
flag stays `false` outside a validated staging environment. See
`docs/handoff-deferred-risks.md` (Risk B) and `docs/staging-supabase-validation.md`.

## Main Branch Note

Local `main` may show historical local-only commits. Do not push local `main`
directly. Start new work from `origin/main`, keep PRs scoped to one trust boundary
(docs/readiness, UX, product logic, backend sync, or launch hardening), avoid mixing
Supabase migrations with visual/UI polish, and run `npm run check` before opening a PR.
