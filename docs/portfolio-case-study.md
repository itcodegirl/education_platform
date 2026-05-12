# Portfolio Case Study: CodeHerWay

## Executive summary

CodeHerWay is a production-minded learning platform built to improve first-time coding confidence while preserving technical rigor. The project balances product clarity, secure architecture, and incremental delivery discipline.

This case study highlights how the platform was hardened for portfolio review across UX, accessibility, release readiness, and developer workflow quality.

For a reviewer who wants direct proof behind the case-study claims, use the claim-to-code map in [docs/reviewer-evidence-map.md](./reviewer-evidence-map.md).

---

## Problem and opportunity

Beginner coding platforms often struggle with two issues:

1. learners do not know what to do next after login
2. projects look polished in screenshots but lack production fundamentals

The goal was to keep the existing core vision and architecture intact while making the product feel more intentional, trustworthy, and demonstrably shippable.

---

## Product goals

- Make the first 30 to 60 seconds clear and guided.
- Improve dashboard and lesson flow clarity.
- Strengthen keyboard and accessibility behavior.
- Standardize visual patterns without overdesign.
- Raise release confidence with explicit quality gates.
- Present the project clearly for recruiters and technical reviewers.

---

## Scope and constraints

- No full rewrite.
- No unnecessary feature expansion.
- Preserve architecture unless a change clearly improved maintainability.
- Deliver in small, verifiable batches with checks after each batch.

---

## Architecture and technical context

### Frontend

- React 18 + Vite
- tokenized CSS and shared UI primitives
- modular component organization by domain (auth, learning, panels, admin, shared)

### Data and auth

- Supabase Auth + Postgres
- Row Level Security as primary authorization boundary

### Server-side capabilities

- Netlify Functions for AI and scheduled workflows
- OpenAI Responses API accessed only through server functions

### Quality workflow

- ESLint, Vitest, and Playwright
- scripted quality gates for local and CI parity
- authenticated smoke coverage that runs when test credentials are configured and self-skips locally when they are not

---

## What was improved

### 1. First-run and UX clarity

- Sharper CTA hierarchy in entry flow
- clearer onboarding and "next step" language
- improved empty states and helper copy where users previously hit dead ends
- replaced misleading sync-retry messaging with an honest local-browser warning that does not risk overwriting unsynced learner progress

### 2. Visual consistency

- standardized controls and state surfaces (buttons, inputs, status blocks)
- harmonized card/panel spacing, radii, and border rhythm
- improved consistency across lesson, panel, and dashboard surfaces

### 3. Accessibility hardening

- keyboard and focus behavior tightened across overlays/modals
- improved semantic and ARIA relationships in dialogs and quiz interactions
- reduced fragile interaction patterns

### 4. Code-health and workflow quality

- improved root scripts for clear unit/integration/release gates
- aligned README, CONTRIBUTING, and release checklist with actual commands
- separated badge catalog metadata from React progress context
- aligned badge eligibility logic with the actual reward catalog
- hardened transient toast feedback so new messages cannot be hidden by stale timers
- added a same-browser retry queue for direct optimistic progress writes so failed learner saves can replay instead of dying as one-shot warnings
- extended that recovery path to recoverable lesson progress and bookmark route mutations, with route-action test coverage to protect the contract
- added privacy-safe sync recovery telemetry for queued writes and replay outcomes, while keeping raw learner payloads out of analytics
- ignored local Playwright auth storage so authenticated test runs do not create commit-risk session files
- blocks the authenticated app shell when profile verification fails, instead of silently treating an unverified profile as safe
- removed the unused legacy route tree so the app has one clear data-router architecture for reviewers to follow
- fixed consecutive XP awards so quiz completion plus perfect-score bonuses accumulate and persist in order
- changed the public hero CTA from a developer-facing styleguide link to a learner-facing first-lesson preview
- added desktop and mobile Playwright coverage for the public landing-to-preview learner path
- added a Lighthouse evidence record and CI artifact upload path so performance claims have a dated-report workflow instead of staying aspirational
- maintained small, intentional commits with check-backed verification

### 5. Learner trust hardening

- replaced fragile quiz identity with stable quiz keys so reward milestones survive copy changes
- ensured lesson, quiz, and challenge XP awards are ledgered once instead of inflating on retries or repeated completion
- preserved completed lesson state across refresh through local persistence coverage
- exposed a visible "Retry now" recovery action when progress writes are queued after a transient save failure
- guarded authenticated smoke coverage so lesson-flow and mobile-learning specs stay wired into CI when credentials are present
- added named critical tests for lesson persistence, duplicate XP prevention, quiz retry, challenge retry, save failure recovery, and mobile sidebar keyboard support
- added account-switching and learner-scoped retry-queue tests so signed-in progress cannot silently bleed between learners in the unit harness
- added a Supabase live-deployment checklist and RLS smoke-check boundary to keep portfolio claims aligned with actual hosted setup work
- clarified lesson completion as saved reading progress, with quizzes and challenges presented as separate checks rather than hidden graduation rules
- added a compact lesson learning contract that names prerequisite, outcome, guided practice, recall check, and proof/transfer expectations before progress evidence is shown
- polished the mobile tools sheet with shared-registry icons, safer disabled states, and constrained labels for narrow screens
- recovered stale lesson URLs to the first useful lesson in the requested course/module instead of sending learners back to the homepage
- hardened saved lessons so older partial bookmark records render as unavailable saved items instead of crashing the panel
- added learner transcript summaries that separate reading progress, recall checks, applied challenges, and due reviews, then recommend one next evidence step instead of implying XP alone proves mastery

---

## Before / After hardening

| Area | Before | After |
| --- | --- | --- |
| Reviewer entry | Multiple branches and historical repos made the canonical project harder to identify. | Root reviewer guide, branch triage, README status, and roadmap now point reviewers to the current product and its limits. |
| Learner flow | New learners could see many tools before the first meaningful action was obvious. | First-session copy, lesson navigation, empty states, and progress surfaces now emphasize the next learning step. |
| Learning structure | Lesson progress could still look like a completion checkbox if a reviewer skipped the content details. | The lesson evidence panel now surfaces a compact learning contract before progress states, making outcome, practice, recall, and proof expectations visible. |
| Reward trust | Quiz/challenge retries and fragile display labels could overstate progress reliability. | Stable quiz ownership, one-time local reward ledgers, retry-safe copy, and explicit backend-sync gating keep claims honest. |
| Evidence clarity | Learners could see progress totals without knowing what evidence still needed attention. | Transcript panels now separate completion evidence from motivational XP and point to the next review, recall, challenge, or portfolio reflection step. |
| Recovery | Save failures were mostly advisory. | Covered progress writes can queue, replay, and expose a visible retry action without claiming universal cloud durability. |
| Stale links | Old or malformed lesson URLs could interrupt the learning flow. | Course and module recovery keeps learners inside the learning path, with tests covering route loader behavior and public preview smoke. |
| Saved lessons | Partial legacy bookmarks assumed complete course and title data. | Saved lesson rows now use safe labels and disabled unavailable states when catalog matching is not possible. |
| Quality signal | Tests existed, but release confidence depended on remembering several separate commands. | Local and CI quality gates now include content, quiz, Playwright project, authenticated E2E readiness, Supabase readiness, Lighthouse evidence, build, bundle, and unit checks. |

---

## Key technical tradeoffs

### Tradeoff: polish speed vs architectural churn

Decision: optimize within current architecture instead of introducing a new state/design framework.

Why: reduced risk, preserved momentum, and kept changes reviewable.

### Tradeoff: richer UX semantics vs test stability

Decision: align ARIA semantics with test expectations and accessibility best practices instead of forcing custom patterns.

Why: prevented regressions while improving screen reader and keyboard behavior.

### Tradeoff: strict release confidence vs local iteration speed

Decision: use simple command gates (`check`, `check:ci`) to keep both fast feedback and CI parity.

Why: stronger release confidence without a complex pipeline redesign.

### Tradeoff: trust cues vs overpromising recovery

Decision: add a real same-browser retry queue for direct optimistic progress writes, extend recoverable lesson route mutations into the same queue, and keep remaining route-action warnings honest where replay is still not implemented.

Why: learners need actionable recovery when saves fail, but the product should not claim universal cloud durability before every persistence path supports it.

### Tradeoff: local reward trust vs production reward authority

Decision: harden local reward ledgers first, keep Supabase reward sync behind feature flags, and document the backend validation still needed.

Why: duplicate XP and disappearing completion states hurt learner trust immediately, while production reward authority should wait for staging validation, RLS review, and duplicate-award constraints.

### Tradeoff: guidance clarity vs lesson clutter

Decision: add a compact lesson contract inside the existing evidence panel instead of creating another dashboard or onboarding step.

Why: learners need to know what a lesson expects, but adding another tool would increase cognitive load. The contract keeps prerequisite, outcome, practice, recall, and proof guidance next to the progress states it explains.

### Tradeoff: observability vs learner privacy

Decision: emit sync queue/replay summaries through the existing analytics path without learner IDs, lesson keys, note content, queue payloads, or raw database errors.

Why: product reliability needs visibility, but portfolio credibility is stronger when analytics discipline is explicit and privacy-preserving.

---

## Security and accessibility posture

### Security

- server-mediated AI integration with authenticated access patterns
- backend-enforced data isolation via RLS
- deployment-level security headers and baseline hardening
- CI checks for dependency and secret-risk visibility

### Accessibility

- stronger dialog semantics (`aria-labelledby` and `aria-describedby`)
- improved keyboard navigation and focus states
- cleaner interaction semantics in quiz, search, and sidebar flows

---

## Outcomes

- clearer user path from landing to lesson completion
- more consistent, premium-feeling UI without sacrificing readability
- stronger confidence in release quality through explicit checks — quiz integrity audit now runs in strict CI mode with all 14 variant groups locked and 53 orphans classified
- more tamper-resistant challenge grading: all HTML challenges use live DOM queries instead of source-text substring checks; CSS challenges use `getComputedStyle` for structural property verification
- more believable progress reliability because direct learner saves can retry after transient failures and rapid XP awards no longer race each other down
- stronger trust in lesson completion and bookmark persistence because recoverable route failures now fall back into the same-browser retry queue
- stronger trust in navigation and saved-state resilience because stale lesson links recover gracefully and legacy bookmark rows no longer break the saved-lessons panel
- stronger trust in learner rewards because lesson, quiz, and challenge completion paths now use stable IDs and once-only award guards
- clearer recovery behavior because queued save failures show a direct retry action near the active learning step
- stronger CI hygiene because authenticated smoke readiness now audits the signed-in, lesson-flow, and mobile-learning specs before credentials are required
- cleaner QA hygiene because authenticated Playwright state is ignored instead of appearing as untracked session residue
- improved AppLayout modularity: lesson view analytics and mark-done action extracted into independent, testable hooks, shrinking the layout file by 60 lines
- hardened trust semantics: progress exports are framed as learning records, resume uses stable course/module/lesson IDs, public profiles expose aggregate fields only, and challenge grading is described as exercise-specific checks rather than credential verification
- stronger educational structure because lesson evidence now includes prerequisite, outcome, guided practice, recall, and proof/transfer guidance in one visible contract
- stronger performance evidence discipline because Lighthouse artifacts are uploaded in CI and the evidence doc is checked by the quality gate
- simplified learning-tool maintenance by moving mobile tool wiring and shared tool copy into a single registry
- clearer portfolio narrative for both non-technical and technical reviewers

---

## Demo walkthrough for interviews

1. Start at landing/auth and describe target learner.
2. Show first-run guidance and dashboard orientation.
3. Open a lesson, show the learning contract, progress evidence, and next-step signaling.
4. Open search/bookmarks/review to demonstrate learning continuity.
5. Explain AI architecture and security boundary.
6. Close with quality gates and release checklist.

---

## What I would do next

- add final screenshot assets in `docs/screenshots/`
- configure Supabase test credentials so authenticated Playwright lesson/mobile flows run in CI instead of self-skipping
- validate Supabase reward persistence in staging, including RLS, idempotent backend reward records, and test-user isolation
- record a dated Lighthouse score row in `docs/lighthouse-evidence.md` from the uploaded CI artifact
- add richer analytics for onboarding drop-off and lesson completion friction
- continue incremental CSS modularization to reduce global stylesheet surface area

---

## Project story (resume-friendly)

Built and hardened a multi-track, self-paced coding education platform (portfolio/demo posture, not production credentialing) with a secure server-mediated AI tutor, accessible interaction design, and a release-grade quality workflow. Improved onboarding clarity, consistency, and maintainability through targeted, check-validated iterations without a full architectural rewrite.
