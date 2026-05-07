# Reviewer Start Here

This is the fastest path for a recruiter or technical reviewer to understand CodeHerWay without getting lost in older repos or future-roadmap claims.

## What This Repo Is

- Active canonical repository: `itcodegirl/education_platform`
- Product name: CodeHerWay Learning Platform
- Status: portfolio/demo-ready, not production-grade
- Archived repositories: historical references only; evaluate this repo as the current product

## What To Review First

1. Read the project posture in [README.md](../README.md).
2. Skim the honest limits in [KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md).
3. Review the staged plan in [docs/repair-roadmap.md](./repair-roadmap.md).
4. For product narrative, read [docs/portfolio-case-study.md](./portfolio-case-study.md).
5. For architecture, read [docs/architecture.md](./architecture.md).
6. For a fast walkthrough, use [docs/reviewer-demo-script.md](./reviewer-demo-script.md).
7. For current trust boundaries, read [docs/trust-boundaries.md](./trust-boundaries.md).
8. If reviewing open PRs or older branches, use [docs/branch-triage.md](./branch-triage.md).

## Trust Boundaries

- Lesson completions, bookmarks, and notes may sync when connected.
- XP, streaks, badges, review queue, and challenge completions are single-device today.
- Progress Summary PDFs are learner progress summaries, not verified certificates.
- Challenge auto-grading is a learning aid. HTML checks inspect rendered DOM snapshots, CSS checks mix computed-style and source-pattern checks, and JavaScript/React checks rely on console/runtime output.
- Backend reward sync is scaffolded but disabled until Supabase migrations and duplicate-award flows are verified against a real project.
- Supabase migration/privacy readiness has a static gate: `npm run check:supabase-readiness`.
- Authenticated persistence has unit coverage for account switching and learner-scoped pending retry queues; live authenticated E2E still needs configured Supabase test credentials.
- "Complete lesson" means saved reading progress. Quiz results and challenge completion are separate learning checks.

## Useful Commands

```bash
npm install
npm run check
npm run test:e2e:smoke:public
```

Focused checks:

```bash
npm run lint
npm run check:js-source
npm run build
npm run audit:content
npm run test:unit
npm run audit:quizzes
```

`npm run check:js-source` is a JS-only source policy check. This repo does not currently run TypeScript type checking.

## Best Code Areas To Inspect

- `src/context/ProgressContext.jsx` - optimistic and canonical progress state orchestration
- `src/engine/rewards/` - local idempotent reward ledger and retry foundation
- `src/routes/learnRouteActions.js` - lesson mutation path and recoverable write descriptors
- `src/components/learning/CodeChallenge.jsx` and `src/hooks/useChallengeSession.js` - challenge UI and grading lifecycle
- `src/utils/lessonKeys.js` and `src/utils/savedPosition.js` - stable-key and legacy-position compatibility work

## Demo Script

Use the full five-minute path in [docs/reviewer-demo-script.md](./reviewer-demo-script.md). The short version:

1. Start at the public landing page and open the first-lesson preview.
2. Sign in or use a configured test learner.
3. Open a lesson, mark it done, and show progress feedback.
4. Open bookmarks, notes, review queue, badges, and challenges to show the learning loop.
5. Open the Progress Summary PDF flow and point out that it is not a verified credential.
6. Close with the roadmap: Phase 1 protects reviewer trust; later phases harden identity, rewards, and launch readiness.
