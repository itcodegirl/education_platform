# Branch And PR Triage

Last reviewed: May 7, 2026.

This note keeps the repo review path clear while older local branches still exist. Treat it as a point-in-time map, not a product roadmap.

## Current Review Stack

Review open PRs in this order:

1. PR #42, `codex/post-merge-stabilization` - Supabase migration readiness and authenticated E2E setup.
2. PR #43, `codex/quiz-key-content-stability` - quiz reward stability, content audit cleanup, mobile navigation, and launch-readiness polish.
3. PR #41, `codex/learning-flow-audit-polish` - overlaps with PR #43 in audit/mobile-preview areas. Rebase, close as superseded, or cherry-pick only remaining unique value after PR #43 is settled.

Do not merge PR #41 before checking overlap with PR #43.

## Parked Local Branches

These branches should not be presented as recruiter-ready work without rebase and review:

- `codex/backend-sync-preserve`
- `codex/backend-sync-release-readiness`
- `codex/backend-sync-split-source`
- `feat/reward-retry-reconciliation`
- `feat/supabase-reward-engine`

Reason: they touch backend reward sync, Supabase migrations, or WIP preservation commits. Keep them parked until migrations can be applied against a real Supabase project and authenticated duplicate-award tests can run.

## Legacy UX And Architecture Branches

These older branches may contain useful ideas, but should be treated as source material rather than merge candidates:

- `codex/phase-roadmap-stability`
- `codex/platform-stability-architecture`
- `codex/trust-accessibility-hardening`
- `codex/education-platform-hardening`
- `feature/ux-trust-calmness-improvements`

Recommended handling:

- Diff each branch against current `main`.
- Cherry-pick only small, still-relevant patches into fresh branches.
- Run `npm run check` before opening any new PR.
- Close or delete stale remotes only after confirming they are represented in merged work.

## Main Branch Note

The local `main` branch may show historical local-only commits. Do not push local `main` directly. Create a fresh `codex/*` branch from `origin/main`, cherry-pick the desired patch, verify it, and open a PR.

## Future Branch Rule

For clean reviewer history:

- Start new work from `origin/main`.
- Keep PRs scoped to one trust boundary: docs/readiness, UX, product logic, backend sync, or launch hardening.
- Avoid mixing Supabase migrations with visual/UI polish.
- Keep backend reward-sync work behind `VITE_REWARD_BACKEND_SYNC_ENABLED=false` until the live migration and duplicate-award verification pass is complete.
