# CodeHerWay Learning Platform

<<<<<<< HEAD
> A free, browser-based coding bootcamp for women learning to ship.
> HTML -> CSS -> JavaScript -> React -> Python, with an AI tutor, a real
> code editor, and gamified progress tracking.

[Live product](https://mellow-sunflower-9c92cd.netlify.app/) · [Security model](./SECURITY.md) · [Architecture](./docs/architecture.md) · [Contributing](./CONTRIBUTING.md)

[![CI](https://github.com/itcodegirl/codeherway-platform/actions/workflows/ci-smoke.yml/badge.svg)](https://github.com/itcodegirl/codeherway-platform/actions/workflows/ci-smoke.yml)
[![Security](https://github.com/itcodegirl/codeherway-platform/actions/workflows/security-audit.yml/badge.svg)](https://github.com/itcodegirl/codeherway-platform/actions/workflows/security-audit.yml)
[![Made with React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)
[![a11y: WCAG AA](https://img.shields.io/badge/a11y-WCAG%20AA-22c55e)](#accessibility-highlights)

![CodeHerWay landing experience](./docs/screenshot.png)

_Landing page and auth experience from the live product._

CodeHerWay is built to feel like a real product, not a tutorial dump:

- one opinionated lesson flow from `hook` to `summary`, designed for momentum instead of content sprawl
- a real Monaco editor with live preview and challenge validation, so learners ship while they study
- an authenticated AI tutor behind a server-side proxy, with rate limits and guardrails built in
- a portfolio-ready frontend with security, accessibility, and product thinking visible in the repo itself
=======
CodeHerWay is an active frontend learning platform project and portfolio product focused on beginner-friendly coding education.

## Current Project Status

- This repository root is the active canonical app.
- `codeherway-v2/` is archived/reference-only and not part of active runtime behavior.
- The project is usable for demos and portfolio review.
- The project is not yet production-grade.

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
>>>>>>> origin/main

## Testing Scope

Current baseline checks:

<<<<<<< HEAD
CodeHerWay is a complete coding curriculum that runs entirely in the
browser. Every lesson follows the same opinionated structure:
**hook -> do -> understand -> build -> challenge -> summary**.

Each lesson ships with:

- a real **Monaco code editor** with live preview in a sandboxed iframe
- an **AI tutor** that knows the current lesson and can explain the learner's own code
- **auto-graded challenges** that validate actual DOM output
- **spaced-repetition** review cards generated from missed quizzes

It is built for women learning to code, lead, and ship.

## Why this repo stands out

This is a portfolio project, but it is also a real product with real
engineering tradeoffs. The strongest public signals in the repo are:

- **Security-first product design.** The database is the real boundary, not the client.
- **Founder-level product thinking.** Curriculum, UX, motivation loops, and brand system all work together.
- **Frontend depth that goes beyond visuals.** The app handles accessibility, chunk recovery, auth, admin surfaces, and progressive enhancement.
- **Evidence over claims.** CI, threat-model notes, Supabase schema, Netlify config, and tests are all visible.

## Product and engineering highlights

- **A server-side AI proxy with a Postgres-backed rate limiter.**
  The OpenAI API key never touches the browser. Requests flow through
  a Netlify Function that verifies the user's Supabase session, calls
  a `SECURITY DEFINER` Postgres RPC (`consume_ai_quota()`), and
  prepends a guardrail prompt before forwarding to OpenAI. The
  function fails closed if the rate limiter is unreachable.
- **Row-Level Security on every table.**
  Twelve Supabase tables enforce `auth.uid() = user_id` policies.
  Admin reads use a separate `is_admin()` security function.
- **An admin escalation guard.**
  A Postgres trigger blocks direct edits to `profiles.is_admin`.
  Promotions must go through `set_user_admin()`, which refuses
  self-edits and writes to `admin_audit_log`.
- **A sandboxed code playground.**
  Learner code runs inside an `<iframe sandbox="allow-scripts">`
  without `allow-same-origin`, so it cannot read the parent origin,
  cookies, or `localStorage`.
- **Per-course code splitting.**
  Each course's lessons, quizzes, and challenges load independently.
  Monaco is lazy-loaded behind a `Suspense` boundary.
- **Chunk-load recovery.**
  If a deploy invalidates a dynamic chunk while a tab is open,
  `main.jsx` catches the error, throttles retries through
  `sessionStorage`, and refreshes once.
- **A real design system.**
  Brand palette, spacing, fluid type, and gradients are defined with
  CSS custom properties, not scattered one-off values.
- **PWA support.**
  The app registers a service worker, shows offline-aware states, and
  handles update prompts.
- **Hardened HTTP headers.**
  CSP, HSTS, COOP, CORP, frame-deny, referrer policy, and restrictive
  permissions policy are all configured in `netlify.toml`.

If you want the deeper story, the
[security audit commits](https://github.com/itcodegirl/codeherway-platform/commits/main)
show the threat model and the fixes that followed.
=======
- `npm run build`
- `npm run lint`
- `npm run test` (Vitest unit/component suite — passes on a fresh clone with no `.env` configured; the suite stubs the `VITE_SUPABASE_*` placeholders via `vitest.config.js` so client-importing tests can evaluate)
- `npm run audit:quizzes`
- `npm run test:e2e` (public smoke path runs by default)

Current test boundaries:

- Authenticated Playwright smoke checks are skipped when auth env credentials are not provided.
- `npm run audit:quizzes` remains the source of truth for quiz integrity drift, including classified orphan quizzes, intentional variant groups, and legacy aliases.
- Quiz audit strict-mode CI criteria are planned but not enabled yet.
- The local reward-event ledger/queue and Supabase reward backend branches are now unified. The local engine remains the default fallback, and backend reward sync remains disabled until the migrations are applied and authenticated reward flows are validated in a real project.
- Backend reward details live in [docs/backend-reward-events.md](./docs/backend-reward-events.md), [docs/atomic-reward-award.md](./docs/atomic-reward-award.md), and [docs/reward-sync-strategy.md](./docs/reward-sync-strategy.md).
- Linting scripts exist, but lint enforcement is not yet treated as a stabilized release gate in this repair stage.

## Known Limitations

See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) for the current limitation baseline, including learning identity hardening, quiz integrity follow-up, reward-event/cross-device limits, search coverage limits, and AI/security hardening scope.

## Repair Roadmap

See [docs/repair-roadmap.md](./docs/repair-roadmap.md) for the staged repair plan:
>>>>>>> origin/main

- P0: Repo trust and documentation
- P1: Learning integrity
- P2: Data model hardening and migration safety
- P3: ADHD-friendly UX simplification
- P4: Reliability testing and CI gates

<<<<<<< HEAD
| Layer | Choice | Why |
| --- | --- | --- |
| UI | React 18 + Vite 6 | Fast HMR, modern bundler, real code splitting |
| Types | TypeScript (services layer) | Hand-written row and DTO types with `tsc --noEmit` in CI |
| Editor | `@monaco-editor/react` | The same editor core that powers VS Code |
| Backend | Supabase (Postgres + Auth + RLS) | Real auth and a real database without a custom server |
| Functions | Netlify Functions (Node 20 ESM) | One platform for API routes and scheduled jobs |
| AI | OpenAI Responses API (`gpt-4o-mini`) | Behind an authenticated proxy |
| Fonts | `@fontsource` self-hosted | No font CDN required in CSP |
| Unit tests | Vitest + React Testing Library + jsdom | Covers gamification, learning engine, and component behavior |
| E2E | Playwright | Browser coverage already wired into CI |
| CI | GitHub Actions | build, smoke tests, typecheck, vitest, `npm audit`, `gitleaks` |
=======
## Recruiter / Hiring Context
>>>>>>> origin/main

This project is intended to demonstrate:

<<<<<<< HEAD
```text
Browser (React 18, PWA)
   |
   +--- REST ----> Supabase (Postgres + Auth + RLS)
   |
   +--- fetch ---> Netlify Functions
                    +-- /ai               auth + rate limit + guardrail -> OpenAI
                    +-- /streak-reminder  daily cron, shared-secret protected
```

Every arrow above is gated by something: a Supabase JWT, an RLS
policy, a Postgres trigger, a CSP, or a shared secret. The full
picture lives in [`SECURITY.md`](./SECURITY.md) and
[`supabase-schema.sql`](./supabase-schema.sql).
=======
- Frontend architecture and modular React app composition
- Product thinking for learning workflows
- Accessibility awareness and iterative UX hardening
- Learning-platform UX and retention-oriented interaction design
- Honest iteration discipline (audit -> staged repairs -> verification)
- Ability to assess and improve a real codebase under constraints

Concrete shape of the project at the current commit:
>>>>>>> origin/main

- Four full courses (HTML, CSS, JavaScript, React).
- A reward system (XP, streaks, badges, bookmarks, spaced-repetition queue) that is event-driven, idempotent (`hasRewardBeenAwarded()` + `markRewardAwarded()`), persisted to Supabase, and reconciles cleanly with the local optimistic state on reload. XP popups and badge-unlock celebrations are queued so back-to-back rewards (e.g. quiz completion + perfect-score bonus) all display in turn instead of overwriting each other.
- A lazy-loaded Monaco editor split into multiple chunks via Vite manual chunking so it never enters the initial bundle.
- A top-level `ErrorBoundary` so a provider crash falls back to a visible retry/reload screen, not a blank page.
- A Vitest unit/component suite of 330+ tests including accessibility integration tests (axe-core).
- A Playwright public smoke suite plus an opt-in authenticated path.

Files most worth a look from a senior reviewer:

- `src/context/ProgressContext.jsx` — the dual-layer optimistic + canonical persistence model, with queued XP-popup and badge-unlock state slots.
- `src/engine/rewards/` — the reward event ledger and idempotent runtime.
- `src/components/learning/QuizView.jsx` + `src/hooks/useQuizSession.js` + `src/components/learning/quiz/questionTypes.jsx` — quiz engine split into a renderer registry + session hook.
- `src/components/learning/CodeChallenge.jsx` + `src/hooks/useChallengeSession.js` + `src/components/learning/challenge/` — challenge engine split into the same shape (session hook + AI panel + preview-builder util). Includes an explicit honesty note in the UI about what the auto-grader actually checks (see `KNOWN_LIMITATIONS.md`).
- `src/components/admin/LessonBuilder.jsx` + `src/hooks/useLessonBuilder.js` + `src/components/admin/lesson-builder/` — admin lesson-authoring tool split into a state hook, a pure codegen util, three view-tab components, and shared `LBField` / `ArrayField` primitives.
- `src/services/aiService.js` — `AIServiceError` carries a stable `code` from `AI_ERROR_CODES`, so callers switch on the code instead of regex-matching error message strings.
- `vite.config.js` — Monaco manual-chunking strategy.

## Stack

- React 18 + Vite
- Supabase Auth + Postgres
- Netlify static hosting + Netlify Functions

## Local Setup

### 1. Install dependencies

```bash
<<<<<<< HEAD
git clone https://github.com/itcodegirl/codeherway-platform.git
cd codeherway-platform
npm ci
cp .env.example .env
npm run dev
```

Then add your Supabase URL and anon key to `.env`.

The AI tutor stays disabled in local dev unless you also run
`netlify dev` with `OPENAI_API_KEY` set. The full environment
reference lives in [`.env.example`](./.env.example).
=======
npm install
```

### 2. Configure environment variables
>>>>>>> origin/main

Copy [`.env.example`](./.env.example) to `.env`:

<<<<<<< HEAD
Open your Supabase project's SQL editor, paste
[`supabase-schema.sql`](./supabase-schema.sql), and run it.
Re-running is safe.

```sql
update public.profiles
set is_admin = true
where id = '<your-uuid>';
```

After bootstrap, every later admin change must go through the
`set_user_admin()` RPC, which refuses self-edits.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run typecheck` | `tsc --noEmit` across TS services |
| `npm run test:e2e` | Run the Playwright E2E suite |
| `npm run test:e2e:ui` | Run Playwright in UI mode |

## Project layout

```text
src/
|-- components/   learning, panels, auth, admin, gamification, layout
|-- services/     auth, progress, gamification, AI, learning engine
|-- lib/          supabase client
|-- data/         course content (HTML, CSS, JS, React, Python)
|-- providers/    Auth, Theme, Progress
|-- routes/       app routing and guards
|-- hooks/        shared interaction hooks
|-- utils/        markdown, iframe styles, Monaco helpers
`-- styles/       design tokens and global styles

netlify/functions/  ai.js, practice-generate.js, streak-reminder.js
supabase-schema.sql tables, RLS, triggers, RPCs, audit log
.github/workflows/  ci-smoke, security-audit, ops-checks
=======
```bash
cp .env.example .env
```

Required frontend values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_REWARD_BACKEND_SYNC_ENABLED=false
>>>>>>> origin/main
```

### 3. Configure Supabase

<<<<<<< HEAD
- **No secrets in the bundle.** The OpenAI key lives only in Netlify env vars.
- **Authenticated AI proxy** with Postgres-backed per-user rate limits, payload caps, and a mandatory server-side guardrail prompt.
- **Row-Level Security** on every Supabase table.
- **Admin escalation guard** through a Postgres trigger, `set_user_admin()`, and `admin_audit_log`.
- **XSS-hardened markdown renderer** with escape-first handling and CSP as defense in depth.
- **Sandboxed code playground** with `allow-scripts` only and no `allow-same-origin`.
- **Strict HTTP headers** including CSP, HSTS, COOP, CORP, frame-deny, referrer policy, and permissions policy.
- **Supply-chain checks** through a committed lockfile, `npm audit`, and `gitleaks`.

Full disclosure process and threat model:
[`SECURITY.md`](./SECURITY.md).

## Accessibility highlights

Everything in the app targets WCAG 2.1 AA. Highlights from the recent
accessibility sweep:

- semantic landmarks across the app shell and sidebars
- one real `<h1>` per page and per dialog context
- reusable focus trapping on modal workflows
- WCAG AA color contrast across token pairs
- visible keyboard focus without noisy mouse-only outlines
- explicit `type="button"` coverage to avoid accidental form submits
- real buttons in interactive list rows instead of clickable `div`s
- global `prefers-reduced-motion` support
- skip-to-content support
- ARIA live regions for non-blocking status updates
- decorative emoji hidden from screen readers

The accessibility work and the threat model are intentionally paired:
both ask who can use the product, under what conditions, and with what
trust guarantees.

## Roadmap

- [x] Animated landing-page hero with scroll-driven storytelling
- [x] Public profile pages (`/#u/:handle`) with opt-in visibility
- [x] AI-generated personalized practice quizzes from missed concepts
- [x] Self-hosted fonts to remove the font CDN from the CSP
- [x] Semantic landmarks and WCAG AA contrast sweep
- [x] `useFocusTrap` hook plus focus traps on modal flows
- [x] Component-level test coverage with React Testing Library and jsdom
- [x] Break apart oversized components into focused children
- [ ] Server-rendered OG images for public profile pages
- [ ] Migrate more components to TypeScript
- [ ] Wire ErrorBoundary to Sentry or LogRocket
- [ ] Add Lighthouse CI with a committed score badge

## Contributing

PRs are welcome, especially new lessons, accessibility fixes, and
security improvements. CI should pass before review. For security
issues, do not open a public issue; use [`SECURITY.md`](./SECURITY.md).

## Design system preview

Every color, spacing value, type size, radius, and motion curve lives
in [`src/styles/tokens.css`](./src/styles/tokens.css). The public
styleguide is available at:

```text
http://localhost:5173/#styleguide
https://mellow-sunflower-9c92cd.netlify.app/#styleguide
```

## Further reading

- [`SECURITY.md`](./SECURITY.md) - full threat model and disclosure process
- [`docs/architecture.md`](./docs/architecture.md) - how the pieces fit together
- [`docs/setup-checklist.md`](./docs/setup-checklist.md) - post-deploy operational steps
- [`CHANGELOG.md`](./CHANGELOG.md) - release history
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - contributing guide

## License

MIT - see [`LICENSE`](./LICENSE).
=======
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
>>>>>>> origin/main

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
