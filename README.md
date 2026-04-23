# Cinova

Cinova is a production-minded, browser-based learning platform focused on helping women build practical coding skills through guided lessons, live coding, and progress-driven feedback.

**Live demo:** https://cinova.app/

## Build and CI status

[![CI](https://img.shields.io/github/actions/workflow/status/itcodegirl/education_platform/ci-smoke.yml?branch=main&label=CI%20(check%3Aci)&logo=githubactions)](https://github.com/itcodegirl/education_platform/actions/workflows/ci-smoke.yml)
[![Typecheck](https://img.shields.io/github/actions/workflow/status/itcodegirl/education_platform/typecheck.yml?branch=main&label=Typecheck%20(JS-only)&logo=javascript)](https://github.com/itcodegirl/education_platform/actions/workflows/typecheck.yml)
[![E2E](https://img.shields.io/github/actions/workflow/status/itcodegirl/education_platform/e2e-smoke.yml?branch=main&label=E2E%20(Playwright)&logo=playwright)](https://github.com/itcodegirl/education_platform/actions/workflows/e2e-smoke.yml)
[![Lighthouse](https://img.shields.io/github/actions/workflow/status/itcodegirl/education_platform/lighthouse-ci.yml?branch=main&label=Lighthouse%20budgets&logo=lighthouse)](https://github.com/itcodegirl/education_platform/actions/workflows/lighthouse-ci.yml)
[![Policy](https://img.shields.io/github/actions/workflow/status/itcodegirl/education_platform/ci-smoke.yml?branch=main&label=Policy%20(RLS%2Fadmin)&logo=supabase)](https://github.com/itcodegirl/education_platform/actions/workflows/ci-smoke.yml)
[![Security](https://github.com/itcodegirl/education_platform/actions/workflows/security-audit.yml/badge.svg)](https://github.com/itcodegirl/education_platform/actions/workflows/security-audit.yml)

[![React 18](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)

---

## Product overview

Cinova is a multi-track learning platform (HTML, CSS, JavaScript, React, Python) designed around a repeatable lesson model:

- Hook
- Do
- Understand
- Build
- Challenge
- Summary

Learners can read, code, test ideas, ask an AI tutor contextual questions, and track progress through XP, streaks, badges, and spaced repetition.

---

## Why this project matters

Most tutorial apps optimize for content volume. This project optimizes for learning momentum and production behavior:

- clearer onboarding and "what to do next" guidance
- real state persistence and progress continuity
- secure AI integration behind server boundaries
- consistent empty/loading/error states across core paths
- accessibility and keyboard-first interaction patterns

For reviewers, this shows product thinking, not just component assembly.

---

## Key features

- Guided lessons with live coding and immediate feedback loops
- Monaco-based editor and preview workflows
- AI tutor and AI-generated practice cards (server mediated)
- Course navigation, bookmarks, glossary, and search
- Spaced repetition queue from missed concepts
- Gamification: XP, streaks, badges, daily momentum
- Public learner profile pages with privacy controls
- Admin dashboard and lesson tooling
- PWA support and offline-oriented behavior

---

## Architecture summary

```text
React SPA (Vite)
  |
  +-- Supabase Auth + Postgres (RLS)
  |
  +-- Netlify Functions
        |- /ai
        |- /practice-generate
        |- /streak-reminder
  |
  +-- OpenAI Responses API (server-side only)
```

Core principle: authorization and security rules are enforced at the backend boundary (RLS + server functions), not trusted to client state.
Routing currently runs in BrowserRouter compatibility mode with centralized path contracts in `src/routes/routePaths.js`.

For a deeper technical walkthrough, see [docs/architecture.md](./docs/architecture.md).

---

## Security and accessibility highlights

### Security

- API keys never exposed to the browser
- Supabase Row Level Security on user-scoped data
- Authenticated AI proxy via Netlify Functions
- Rate limiting and guardrail prompt handling in server flow
- Security headers in `netlify.toml` (CSP, HSTS, COOP, CORP, frame protections)
- CI security checks (`npm audit`, secret scanning)

### Accessibility

- semantic landmarks and structured heading hierarchy
- keyboard-navigable dialogs and overlays with focus management
- visible focus states across interactive controls
- meaningful labels and ARIA wiring for high-traffic interactions
- reduced-motion support

---

## Technical challenges and tradeoffs

1. Rich UX vs maintainability
   - Chose tokenized CSS + shared UI primitives for consistency without introducing a heavy design-system dependency.

2. AI usefulness vs safety and cost control
   - Kept AI calls server-mediated with strict payload controls and per-user limits.

3. Fast initial load vs feature depth
   - Used lazy loading and chunk strategy by domain/course to avoid overloading first paint.
   - Monaco and admin surfaces are intentionally code-split into on-demand chunks so first-run learners do not pay editor/admin cost upfront.
   - Poppins and Space Mono are bundled as Latin-only subsets to reduce first-load font payload while keeping branding intact for the primary audience.
   - Added a bundle budget gate (`npm run check:bundle`) to keep eager chunks lean while allowing controlled Monaco-specific budgets.

4. Incremental improvement vs full rewrite temptation
   - Preserved architecture and made focused, auditable improvements in small batches.

---

## Demo path (3 to 5 minutes)

For portfolio demos, use this flow:

1. Open landing/auth and explain product purpose in one sentence.
2. Enter the dashboard and show first-run guidance.
3. Open a lesson, mark progress, and navigate to the next step.
4. Trigger search/bookmarks/review panel and show continuity.
5. Show AI tutor flow and explain server-side guardrails.
6. Close with profile/progress and release-quality checks.

---

## Screenshots (placeholders)

Add final screenshots to `docs/screenshots/` using these filenames:

- `01-landing-auth.png` - landing and primary CTA hierarchy
- `02-dashboard-first-run.png` - dashboard clarity and onboarding hints
- `03-lesson-flow.png` - lesson page, progress, and next-step guidance
- `04-tools-panels.png` - search/bookmarks/review side panels
- `05-profile-progress.png` - profile and progress surface

See placeholder guidance in [docs/screenshots/README.md](./docs/screenshots/README.md).

---

## Local setup

```bash
git clone https://github.com/itcodegirl/education_platform.git
cd education_platform
npm ci
cp .env.example .env
npm run dev
```

### Required environment values

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (for function-backed AI features)
- optional: `OPENAI_MODEL`

### Database bootstrap

1. Apply [supabase-schema.sql](./supabase-schema.sql).
2. Optionally seed an admin user:

```sql
update public.profiles set is_admin = true where id = '<your-uuid>';
```

---

## Deployment notes

- Primary deploy target: Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Scheduled job: `streak-reminder` (cron in `netlify.toml`)

Pre-release checklist is documented in [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md).

---

## Quality and release workflow

- `npm run typecheck` - JS-only guard (fails if `.ts`/`.tsx` files are introduced)
- `npm run check:quality` - lint + build + bundle budget gate
- `npm run test:unit` - unit tests (Vitest)
- `npm run check` - quality checks + unit tests
- `npm run check:ci` - `check` + Playwright integration/E2E suite
- `npm run check:bundle` - verifies JS chunk budgets after build (stricter on eager chunks, explicit allowance for lazy Monaco chunks)
- `npm run test:policy` - Supabase integration policy checks (RLS/admin escalation paths)
- `npm run test:lighthouse` - Lighthouse CI assertions with score thresholds and budget gates

### CI policy test secrets (dedicated Supabase test project)

The CI workflow includes a separate policy integration job that runs `test:policy` against a dedicated Supabase project.

Configure scoped repository secrets:

- `POLICY_SUPABASE_URL`
- `POLICY_SUPABASE_ANON_KEY`
- `POLICY_SUPABASE_SERVICE_KEY`

Notes:

- Use a non-production Supabase project for policy tests.
- Service key is used only in CI to seed/cleanup ephemeral test users and verify policy boundaries.
- If secrets are absent (for example in forked PRs), the policy suite safely skips.
- Recommended branch protection checks: `check:ci`, `deploy-preview-smoke`, `Supabase policy integration`, `typecheck`, `e2e-smoke`, `lighthouse`.

Additional scripts are listed in [package.json](./package.json).

---

## Roadmap

- [x] Production-style onboarding and first-run clarity
- [x] Shared component/state patterns for panel consistency
- [x] Security-hardened AI gateway and release checks
- [x] Accessibility semantics and focus-state improvements
- [ ] Server-rendered OG metadata for richer sharing
- [x] Add Lighthouse CI reporting to release pipeline
- [ ] Expand product analytics for onboarding and completion friction

---

## Lessons learned

- UX polish is mostly consistency, not flashy effects.
- Accessibility is easier to sustain when built into shared primitives.
- Small, check-validated batches produce safer momentum than rewrites.
- Recruiter-facing documentation should explain both product value and engineering tradeoffs.

---

## Portfolio case study

Read the narrative version here:

- [docs/portfolio-case-study.md](./docs/portfolio-case-study.md)

---

## Additional docs

- [SECURITY.md](./SECURITY.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [docs/architecture.md](./docs/architecture.md)
- [docs/style-architecture.md](./docs/style-architecture.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [LICENSE](./LICENSE)
