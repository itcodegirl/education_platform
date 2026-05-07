# Repair Roadmap

This roadmap tracks the prioritized stabilization path for CodeHerWay. It is intentionally honest about the difference between portfolio-ready, product-trust-ready, and production-ready.

## Phase 1: Stabilize

Goal: make the project safe to show to recruiters without confusing them or overstating product trust.

Tasks:

- Rename or clearly mark the canonical repo.
- Remove archived repos from portfolio navigation.
- Add a Reviewer Start Here doc.
- Align README, Known Limitations, repair roadmap, and package scripts.
- Correct challenge-grading disclosure.
- Rename certificate/export copy to Progress Summary unless verification exists.
- Rename typecheck or add real type checking.
- Update public copy to say single-device rewards are local today.

Expected result:

Recruiters land in the right repo, understand the product's real status, and do not catch obvious claim mismatches.

## Phase 2: Clarify UX

Goal: make the learner journey calmer and more obvious.

Tasks:

- Strengthen first-session flow around one primary action.
- Reduce tool visibility before the learner has progress.
- Improve empty states for bookmarks, review queue, projects, badges, and notes.
- Add route recovery for invalid lesson links.
- Make sync warnings more specific and reassuring.
- Fix quiz retry copy.
- Audit mobile panel/tool stacking.

Expected result:

A beginner knows what to do next without feeling like they opened a productivity app designed by committee.

## Phase 3: Strengthen Product Logic

Goal: make progress, rewards, and identity more trustworthy.

Tasks:

- Complete stable ID persistence for course/module/lesson/quiz/challenge/badge.
- Migrate saved position away from display labels.
- User-scope localStorage keys.
- Consolidate route action and service mutation logic.
- Move XP, streaks, badges, SR queue, and challenge completions toward backend-backed idempotent records.
- Decide local import/backfill policy for existing reward ledger data.
- Add durable certificate verification only after server-backed completion records exist.

Expected result:

Progress survives content changes, device changes, and normal product evolution.

## Phase 4: Portfolio Polish

Goal: turn the project into a strong case study.

Tasks:

- Add polished screenshots/GIFs.
- Add concise architecture diagram.
- Add Before / After hardening section.
- Reduce overly historical comments in source files.
- Move audit rationale into docs/ADRs.
- Highlight testing, performance, accessibility, and persistence decisions.
- Add a short demo script for recruiters.

Expected result:

The project reads like a thoughtful product build, not a pile of features wearing a nice gradient.

## Phase 5: Launch Readiness

Goal: move from portfolio-ready to production-ready.

Tasks:

- Apply and verify Supabase reward migrations.
- Enable backend reward sync only after duplicate-award tests pass.
- Add authenticated E2E coverage as required CI.
- Expand accessibility tests across the signed-in app.
- Run Lighthouse and enforce measurable performance budgets.
- Add privacy/terms/security docs.
- Add backend observability for failed sync/reward writes.
- Add verified certificate links only if the backend supports them.

Expected result:

CodeHerWay becomes credible as a public learning platform, not just a strong portfolio product.
