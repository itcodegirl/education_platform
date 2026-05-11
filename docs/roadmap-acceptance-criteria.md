# Roadmap Acceptance Criteria

This doc turns the repair roadmap into reviewable exit criteria. The goal is to make each phase measurable enough that a recruiter, maintainer, or future contributor can tell whether the phase is actually done.

## Phase 1: Stabilize

Exit criteria:

- The active canonical repository is named or marked clearly in README and reviewer docs.
- Archived repositories are not presented as active portfolio entry points.
- README, Known Limitations, repair roadmap, package scripts, and public copy agree on current product status.
- Challenge grading copy explains what the grader really checks.
- Progress Summary copy does not imply verified certification.
- The JS-only source policy is named honestly; no script claims TypeScript type checking unless real type checking exists.
- Public copy says XP, badges, streaks, review queue, and challenge completions are single-device today.

Evidence:

- `README.md`
- `KNOWN_LIMITATIONS.md`
- `docs/reviewer-start-here.md`
- `docs/repair-roadmap.md`
- `npm run check:quality`

## Phase 2: Clarify UX

Exit criteria:

- First-session UI centers one primary learner action: read the current lesson, then complete it.
- Advanced tools are reduced before a learner completes at least one lesson.
- Empty states for saved lessons, review queue, projects, badges, and notes explain the next useful action.
- Invalid lesson routes recover to a useful learning path rather than dead-ending.
- Sync warnings distinguish same-browser queued recovery from advisory warnings.
- Quiz retry copy explains practice vs one-time XP reward behavior.
- Mobile lesson navigation, tools, and panels do not stack over each other at common mobile widths.

Evidence:

- `src/constants/learningTools.js`
- `src/routes/learnRouteRecovery.js`
- `src/utils/syncStatusCopy.js`
- `src/components/learning/QuizView.jsx`
- `src/components/panels/`
- `npm run test:a11y`
- `npm run test:e2e:smoke:mobile` when authenticated test credentials are configured

## Phase 3: Strengthen Product Logic

Exit criteria:

- Course, module, lesson, quiz, challenge, and badge records use stable IDs for persisted identity.
- Saved position no longer depends on display labels as the primary resolver.
- Browser storage keys are scoped by learner identity when a learner is signed in.
- Lesson route actions and service mutation logic share one recoverable write contract.
- XP, streaks, badges, review queue, and challenge completions have a backend-backed idempotency path before cross-device claims are made.
- Existing local reward ledger data has a deliberate import/backfill policy.
- Verified certificate links are blocked until server-backed completion records exist.

Evidence:

- `docs/learner-state-model.md`
- `docs/trust-boundaries.md`
- `docs/reward-sync-strategy.md`
- `docs/backend-reward-events.md`
- migration tests for renamed lesson titles and duplicate reward awards

## Phase 4: Portfolio Polish

Exit criteria:

- Reviewer screenshots or GIFs show workflows, not only static UI.
- Architecture docs include one concise visual map of the learning shell, persistence, rewards, and backend boundaries.
- The case study explains before/after hardening clearly.
- Historical audit rationale lives in docs or ADRs, not long source comments.
- Testing, performance, accessibility, persistence, and product-trust decisions are easy to find from README.
- A short recruiter demo script exists and can be completed in under five minutes.

Evidence:

- `docs/reviewer-demo-script.md`
- `docs/portfolio-case-study.md`
- `docs/architecture.md`
- `docs/screenshots/`

## Phase 5: Launch Readiness

Exit criteria:

- Supabase reward migrations are applied and verified against a real project.
- Backend reward sync is enabled only after duplicate-award tests pass.
- Authenticated E2E coverage is required in CI for protected learning flows.
- Accessibility tests cover signed-in dashboard, lesson, quiz, and tool panels.
- Lighthouse performance budgets are measured and enforced.
- Privacy, terms, and security docs are public-launch ready.
- Backend observability captures failed sync and reward writes without leaking learner content.
- Verified certificate links exist only when backend verification supports them.

Evidence:

- `docs/staging-supabase-validation.md`
- `docs/supabase-production-readiness.md`
- `SECURITY.md`
- CI logs for authenticated E2E and Lighthouse

## Cross-Phase Risk Register

| Risk | Current status | Next control |
| --- | --- | --- |
| Reward trust overclaim | Documented and feature-gated | Verify migrations and duplicate-award flows before enabling backend sync |
| Display-label identity drift | Guarded by lesson-label audit | Complete stable saved-position migration |
| Multi-user localStorage bleed | Known Phase 3 gap | Scope learner-owned local keys by user id |
| Authenticated E2E skipping locally | Documented | Require configured secrets in CI before private beta |
| Content drift | Partially guarded by quiz and label audits | Keep `npm run audit:content` in quality checks |
| Certificate trust | Progress Summary only today | Add verified certificates only after server-backed completion records |
