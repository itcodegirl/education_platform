# CodeHerWay

> A free, browser-based learning platform for women learning to code.
> HTML -> CSS -> JavaScript -> React -> Python, with an AI tutor, live code sandbox, and gamified progress tracking.

**Live:** https://mellow-sunflower-9c92cd.netlify.app/  
**Threat model & security:** [`SECURITY.md`](./SECURITY.md)

[![CI](https://github.com/itcodegirl/education_platform/actions/workflows/ci-smoke.yml/badge.svg)](https://github.com/itcodegirl/education_platform/actions/workflows/ci-smoke.yml)
[![Security](https://github.com/itcodegirl/education_platform/actions/workflows/security-audit.yml/badge.svg)](https://github.com/itcodegirl/education_platform/actions/workflows/security-audit.yml)
[![React 18](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)

CodeHerWay is a **real product-oriented coding platform** built for self-paced learning with:

- real project lessons that run code in-browser
- immediate AI-assisted feedback
- visible progress, gamification, and spaced repetition
- production-minded security and accessibility baseline

---

## What it is

CodeHerWay is a complete coding bootcamp-style web app that runs entirely in the browser and supports multiple tracks:

- HTML / CSS
- JavaScript
- React
- Python

Every lesson follows a single, repeatable shape:

- Hook
- Do
- Understand
- Build
- Challenge
- Summary

Each lesson includes:

- Monaco-based editor with live preview
- in-app AI tutor aligned to the current lesson
- auto-graded checks and challenge rails
- review-card generation from mistakes

The product is intentionally optimized for clear sequencing:

- onboarding flow for first-time learners
- predictable lesson navigation
- quick access to bookmarks, glossary, review queue, and AI support

---

## What this product demonstrates

This is portfolio-grade work focused on practical engineering tradeoffs:

- **Secure, server-mediated AI usage**
  - API keys stay in Netlify Function runtime
  - per-user rate limits live in Postgres (`consume_ai_quota()`)
  - server-side guardrails are injected before forwarding prompts
  - request failures fail closed when quotas/routing are unavailable

- **Data security by architecture**
  - Supabase Row Level Security for every user table
- **Admin hardening**
  - admin escalation through server-side RPC (`set_user_admin()`)
  - trigger-based guard preventing self-privilege escalation
  - audit trail for admin changes

- **Safe execution model**
  - learner code runs inside a sandboxed iframe
  - no `allow-same-origin`, no shared cookies/localStorage leakage

- **Resilience and reliability**
  - dynamic chunk recovery path with fallback + refresh throttling
  - explicit loading, empty, and error states across critical paths

- **Design coherence and usability**
  - shared design tokens in CSS
  - consistent patterns for loading/error/empty states
  - focus management for modal workflows
  - reduced-friction onboarding and lesson metadata signals

---

## Product polish focus (current release)

### Onboarding
- Clear first-run sequence (welcome flow and context-aware “welcome back” messaging)
- Accessibility-safe modal focus trap with Escape-to-close
- stronger progress labels and clearer next-step copy

### Lesson flow
- lesson header metadata now consistently describes duration, concepts, tasks, and scaffolding
- clearer icon/text pairing for completion and bookmark actions
- more robust summary text and button labels

### Dashboard and learning panels
- consistent quick-action styling and labels in shared tool surfaces
- standard role/ARIA usage and loading/error behavior for admin and panel views
- stronger handling for missing/empty panel states

### Readiness and release quality
- explicit checks for linting and type safety after each feature batch
- polished case-study-oriented documentation to support portfolio review

---

## Architecture at a glance

```
Browser (React 18, PWA)
 |
 +-- REST fetch --> Netlify Functions
 |     |
 |     +-- /ai: AI tutor proxy + quota checks + guardrail prompt
 |     +-- /streak-reminder: scheduled progress reminders
 |
 +-- Auth + DB --> Supabase (Postgres + Auth + RLS)
       |
       +-- Profiles / progress / lessons / quizzes / badges
```

The app intentionally keeps business rules at the database boundary first:
RLS and stored functions authorize what can happen; UI reflects those guarantees.

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| UI | React 18 + Vite 6 | Fast development, modern bundling, and predictable performance |
| State & auth | Supabase Auth | Realistic authentication and server-backed profile model |
| Functions | Netlify Functions (Node 20 ESM) | Single deploy surface for backend tasks |
| AI | OpenAI Responses API (through proxy) | Controlled costs, safety, and key protection |
| Editor | Monaco | Familiar enterprise-grade code editing UX |
| Styling | CSS variables + tokenized design system | predictable scale and palette consistency |
| Types | TypeScript (service layer) | compile-time confidence with `tsc --noEmit` |
| Testing | Vitest + RTL + Playwright | unit and E2E confidence |
| CI | GitHub Actions | lint, typecheck, tests, and security checks |

---

## Repo structure

```text
src/
  ├── components/    learning, panels, admin, auth, gamification, layout, shared
  ├── providers/     Auth, Theme, Progress, CourseContent, AI, SR
  ├── services/      auth, progress, AI, learning, gamification
  ├── hooks/         navigation, storage, focus, admin data
  ├── routes/        auth/guarded app routes + route-level loading/error states
  ├── data/          lesson content by domain
  ├── styles/        token system + responsive behavior
  ├── utils/         markdown/monaco helpers
  └── netlify/functions ai.js + streak-reminder.js
```

---

## Run locally

```bash
git clone https://github.com/itcodegirl/education_platform.git
cd education_platform
npm ci
cp .env.example .env       # add Supabase URL + anon key
npm run dev               # http://localhost:5173
```

The AI tutor and some admin features require Netlify environment values for local production parity.

### One-time database setup

1. Open your Supabase SQL editor.
2. Apply [`supabase-schema.sql`](./supabase-schema.sql).
3. Seed admin:

```sql
update public.profiles set is_admin = true where id = '<your-uuid>';
```

After this, admin role changes are managed by RPC and trigger controls.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint across the app |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm test` | Vitest suite |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:headed` | Playwright headed mode |
| `npm run test:e2e:update-snapshots` | Rebaseline visual snapshots |

Public visual suites and auth flows are designed to skip cleanly when credentials are absent.

### Release checks used by this portfolio

1. `npm run lint`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`
5. `npm run test:e2e` (if environment allows)

---

## Accessibility notes

- Semantic landmarks (`main`, `nav`, `header`, `footer`) and consistent page structure
- explicit heading hierarchy and single `h1` intent per view
- keyboard-safe modal behavior and focus return on close
- visible focus-visible styling with pointer-keyboard distinction
- reduced-motion support through global media query
- decorative icons properly marked so screen readers stay focused on instructional content

---

## Case study snapshot

### Problem

The platform needed to feel production-like for hiring review while retaining the existing architecture. The biggest risks were:

- mixed UI clarity across onboarding, lesson metadata, and bottom tool actions
- uneven empty/loading/error behavior in less visible paths
- documentation that did not match portfolio-facing polish expectations

### Approach

- prioritize targeted, low-risk polish passes rather than refactors
- preserve architecture and data contracts
- make each change batch small and reviewable
- keep accessibility and responsive behavior as part of every UI edit

### Outcome

- faster first-time learner orientation through clearer onboarding state
- cleaner lesson and course metadata interpretation inside lesson headers
- stronger portfolio positioning through consistent release checks and cleaner documentation
- incremental commit trail with check-validated batches

---

## Security highlights

- API secrets remain server-side
- authenticated AI proxy with session validation
- per-user quota + fallback protection
- CSP/HSTS/COOP/CORP/Referrer + permissions hardening in Netlify config
- audit trail for elevated account operations

---

## Roadmap

- [x] Animated, clear onboarding and lesson entry experience
- [x] Public profile pages with RLS policy coverage
- [x] AI-assisted personalized review prompts from missed items
- [x] Server-side AI proxy and guarded usage
- [x] Accessibility-first modal workflows
- [x] Component-level test coverage
- [ ] Server-rendered OG cards
- [ ] TypeScript migration for remaining legacy components
- [ ] Lighthouse CI score reporting and badge hardening

---

## Contributing

PRs are welcome, especially for lesson content, accessibility, and security.
CI must pass (`ci-smoke`, `security-audit`).
For security disclosures, see [`SECURITY.md`](./SECURITY.md).

---

## Further reading

- [SECURITY.md](./SECURITY.md) — Threat model and controls
- [CHANGELOG.md](./CHANGELOG.md) — release history
- [docs/architecture.md](./docs/architecture.md) — architecture narrative
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [LICENSE](./LICENSE)

Built by [@itcodegirl](https://github.com/itcodegirl).
