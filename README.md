# CodeHerWay Learning Platform

CodeHerWay is an active frontend learning platform project and portfolio product focused on beginner-friendly coding education.

## Current Project Status

- This repository root is the active canonical app.
- The project is usable for demos and portfolio review.
- The project is not yet production-grade.
- The quality baseline currently includes lint, production build, bundle budget, unit tests, quiz audit reporting, and Playwright smoke coverage.

## What Is Currently Working

- Course browsing and lesson viewing UI for HTML, CSS, JavaScript, and React tracks.
- Progress save/reload behavior for core learning flow.
- Unified reward-engine hardening for lesson completion XP, quiz retry XP, activity-based streaks, challenge completion dedupe, local reward-event processing, local retry/reconciliation evidence, diagnostics, sync-failure visibility, and feature-gated Supabase backend awards.
- Supabase reward backend scaffolding for future cross-device idempotency, including reward-event migrations, an atomic award RPC, and a frontend service wrapper that preserves local fallback behavior.
- Active lesson quiz coverage for HTML, CSS, JavaScript, and React tracks is complete.
- Quiz variant groups and legacy orphan quiz inventory are classified and monitored by the audit.
- Bookmarks and lesson notes in the active app.
- Certificate export flow.
- Public Playwright smoke coverage.
- Netlify + Vite build/deploy flow.

## Testing Scope

Current baseline checks:

- `npm run check` (lint, production build, bundle budget, unit tests)
- `npm run build`
- `npm run lint`
- `npm run test` (Vitest unit/component suite — passes on a fresh clone with no `.env` configured; the suite stubs the `VITE_SUPABASE_*` placeholders via `vitest.config.js` so client-importing tests can evaluate)
- `npm run audit:quizzes`
- `npm run test:e2e` (public smoke path runs by default)

Current test boundaries:

- Authenticated Playwright smoke checks are skipped when auth env credentials are not provided.
- Playwright authenticated storage state is generated under `playwright/.auth/` and intentionally ignored by Git.
- `npm run audit:quizzes` remains the source of truth for quiz integrity drift, including classified orphan quizzes, intentional variant groups, and legacy aliases.
- Quiz audit strict-mode CI criteria are planned but not enabled yet.
- The local reward-event ledger/queue and Supabase reward backend branches are now unified. The local engine remains the default fallback, and backend reward sync remains disabled until the migrations are applied and authenticated reward flows are validated in a real project.
- Backend reward details live in [docs/backend-reward-events.md](./docs/backend-reward-events.md), [docs/atomic-reward-award.md](./docs/atomic-reward-award.md), and [docs/reward-sync-strategy.md](./docs/reward-sync-strategy.md).
- Authenticated smoke checks are enabled in the suite, but they self-skip unless Supabase and learner test credentials are configured.
- Direct optimistic progress writes now use a same-browser retry queue with manual retry, reconnect retry, and next-session replay.
- Recoverable lesson route mutations for completion toggles and bookmarks now feed that same-browser retry queue when Supabase route actions fail with a recoverable write descriptor.
- Progress sync queue and replay outcomes emit privacy-safe analytics events when analytics is configured; event payloads avoid learner IDs, lesson keys, note content, and raw database messages.
- Backend reward sync and non-recoverable route failures still surface advisory warnings where full replay/import is not implemented yet.
- Progress sync recovery details live in [docs/progress-sync-recovery.md](./docs/progress-sync-recovery.md).

## Known Limitations

See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) for the current limitation baseline, including learning identity hardening, quiz integrity follow-up, reward-event/cross-device limits, search coverage limits, and AI/security hardening scope.

## Repair Roadmap

See [docs/repair-roadmap.md](./docs/repair-roadmap.md) for the staged repair plan:

- P0: Repo trust and documentation
- P1: Learning integrity
- P2: Data model hardening and migration safety
- P3: ADHD-friendly UX simplification
- P4: Reliability testing and CI gates

## Recruiter / Hiring Context

This project is intended to demonstrate:

- Frontend architecture and modular React app composition
- Product thinking for learning workflows
- Accessibility awareness and iterative UX hardening
- Learning-platform UX and retention-oriented interaction design
- Honest iteration discipline (audit -> staged repairs -> verification)
- Ability to assess and improve a real codebase under constraints

Reviewer shortcuts:

- Product story: [docs/portfolio-case-study.md](./docs/portfolio-case-study.md)
- Progress sync recovery: [docs/progress-sync-recovery.md](./docs/progress-sync-recovery.md)
- Architecture overview: [docs/architecture.md](./docs/architecture.md)
- Release checklist: [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)
- Known limitations: [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)
- Screenshot capture guidance: [docs/screenshots/README.md](./docs/screenshots/README.md)

This should be presented as a stabilized learning-platform case study, not as a finished production SaaS product.

Concrete shape of the project at the current commit:

- Four full courses (HTML, CSS, JavaScript, React).
- A reward system (XP, streaks, badges, bookmarks, spaced-repetition queue) that is event-driven, idempotent (`hasRewardBeenAwarded()` + `markRewardAwarded()`), persisted to Supabase, and reconciles cleanly with the local optimistic state on reload. XP popups and badge-unlock celebrations are queued so back-to-back rewards (e.g. quiz completion + perfect-score bonus) all display in turn instead of overwriting each other.
- A lazy-loaded Monaco editor split into multiple chunks via Vite manual chunking so it never enters the initial bundle.
- A top-level `ErrorBoundary` so a provider crash falls back to a visible retry/reload screen, not a blank page.
- A Vitest unit/component suite of 500+ tests including accessibility integration tests (axe-core).
- A Playwright public smoke suite plus an opt-in authenticated path.

Files most worth a look from a senior reviewer:

- `src/context/ProgressContext.jsx` — the dual-layer optimistic + canonical persistence model, with queued XP-popup and badge-unlock state slots.
- `src/services/badgeRules.js` — pure badge eligibility rules (`evaluateBadgeChecks`, `findNewlyEarnedBadges`) extracted from ProgressContext so they're testable in isolation. Re-exports `BADGE_DEFS` from `src/data/badges.js` (the canonical catalog home).
- `src/services/srAlgorithm.js` — pure SM-2-style spaced-repetition scheduling (`nextSRCardState`) extracted from `ProgressContext.updateSRCard` for the same reason.
- `src/hooks/useAutoDismissReveal.js` — drives the visible-time + fade-out + queue-clear lifecycle for `XPPopup` and `BadgeUnlock`, with timer coalescing so a manual dismiss + auto dismiss firing close together can't shift the queue twice (and silently drop a fresh celebration).
- `src/engine/rewards/` — the reward event ledger and idempotent runtime.
- `src/components/learning/QuizView.jsx` + `src/hooks/useQuizSession.js` + `src/components/learning/quiz/questionTypes.jsx` — quiz engine split into a renderer registry + session hook.
- `src/components/learning/CodeChallenge.jsx` + `src/hooks/useChallengeSession.js` + `src/components/learning/challenge/` — challenge engine split into the same shape (session hook + AI panel + preview-builder util). The session hook waits for the iframe's `onLoad` before grading so DOM-based test assertions can land cleanly; `src/data/html/challenges.js` (`html-ch-1`) is the demonstrated migration. Includes an explicit honesty note in the UI about what the auto-grader actually checks (see `KNOWN_LIMITATIONS.md`).
- `src/components/admin/LessonBuilder.jsx` + `src/hooks/useLessonBuilder.js` + `src/components/admin/lesson-builder/` — admin lesson-authoring tool split into a state hook, a pure codegen util, three view-tab components, and shared `LBField` / `ArrayField` primitives.
- `src/services/aiService.js` — `AIServiceError` carries a stable `code` from `AI_ERROR_CODES`, so callers switch on the code instead of regex-matching error message strings.
- `src/hooks/useDocumentTitle.js` + `src/utils/lessonNavCopy.js` + `src/utils/savedPosition.js` + `src/utils/learnerLocalStore.js` — small reusable primitives extracted out of the layout / context layer so the orchestrator components are composition glue rather than inline business logic. Each ships with a focused unit-test file.
- `src/utils/helpers.js` — `getActiveStreakDays(streakDays, lastDate, today, yesterday)` is a deliberate display-only guard: the persisted streak is the value as of the learner's last activity, but if they then miss a day, the topbar would happily show "5 day streak" until the next activity. The pure helper returns 0 when last activity is older than yesterday so the UI never silently lies, while the DB write path is unchanged so the count resumes cleanly when the learner is back in the today/yesterday window. Companion `getPausedStreak()` returns the lapsed streak as a recovery payload so the WelcomeBack overlay can offer "pick it back up" instead of pretending the streak never happened.
- `src/utils/lessonToggle.js` — `resolveLessonToggle(completedSet, stableKey, legacyKey)` codifies the stable-first-then-legacy preference for the Mark Done toggle. Migration-aware: an old learner whose DB row uses the legacy label-derived key gets that exact key toggled off, while new completions land on the stable key.
- `src/hooks/useMarkLessonDone.js` + `src/hooks/useToggleBookmark.js` — own the lesson-level mutation flows (mark complete + bookmark toggle + bookmark removal). The bookmark file exports both `useToggleBookmark` (used by LessonView) and `useRemoveBookmark` (used by BookmarksPanel), sharing one private submitter so the two surfaces can't drift. Each hook bundles the useFetcher mutation, sync-failure plumbing, optimistic toggle dispatch, and (for mark-done) the min-feedback duration. Each ships with its own focused unit-test file.
- `src/hooks/useTodayKey.js` — drives midnight-aware re-evaluation of the streak/daily-count display guards. Schedules a single setTimeout to the next UTC midnight (more efficient than fixed polling) and listens for visibilitychange to refresh after sleep/throttling. Functional `setState` short-circuits unchanged days. Without this, a learner who left the tab open across midnight would see yesterday's streak/dailyCount until they reloaded.
- `src/hooks/usePrefersReducedData.js` — Data Saver / `prefers-reduced-data` aware hook that gates the Monaco editor on desktop the same way `useIsMobile` already gates it on phones.
- `vite.config.js` — Monaco manual-chunking strategy.

## Stack

- React 18 + Vite
- Supabase Auth + Postgres
- Netlify static hosting + Netlify Functions

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy [`.env.example`](./.env.example) to `.env`:

```bash
cp .env.example .env
```

Required frontend values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_REWARD_BACKEND_SYNC_ENABLED=false
```

### 3. Configure Supabase

1. Create a Supabase project.
2. Run [`supabase-schema.sql`](./supabase-schema.sql) in Supabase SQL editor.
3. For the optional backend reward engine, run the additive SQL files in [`supabase/migrations`](./supabase/migrations) after the base schema.
4. Keep `VITE_REWARD_BACKEND_SYNC_ENABLED=false` until `reward_events` and `award_reward_event` are applied and verified.
5. Enable Email auth.
6. Optionally enable Google/GitHub auth.

### 4. Run the app

```bash
npm run dev
```

## Playwright Smoke Tests

Install Chromium once:

```bash
npm run test:e2e:install
```

Run smoke tests:

```bash
npm run test:e2e
```

Optional authenticated smoke coverage requires:

```env
E2E_EMAIL=learner@example.com
E2E_PASSWORD=your-test-password
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Netlify Deploy

Configured in [`netlify.toml`](./netlify.toml):

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

For release QA, use [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md).
