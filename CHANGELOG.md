# Changelog

All notable changes to CodeHerWay. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
semantic versioning.

## [Unreleased] — `claude/audit-improve-platform-cb4PI`

Small portfolio-polish sweep on top of the prior stabilized baseline.
Lint clean, build green, 509 unit tests still passing.

### Fixed

- **Auth card brand glyph** — replaced the literal `*` (rendered as a
  44px glowing brand icon) with the `</>` brand mark. Reads as part of
  the wordmark instead of a debug placeholder.
- **Auth submit button** — loading state now announces
  `Signing in…` / `Creating account…` instead of an opaque `'...'`,
  so screen-reader and visual users both know what's in flight.
- **Disabled-account screen** — `[ ]` placeholder icon replaced with
  the ⊘ glyph already used elsewhere in the route chrome; copy
  realigned to sentence case (`Account disabled`, `Log out`,
  `Contact support`) to match the rest of the app.
- **Course-skeleton fallback** — the unknown-course icon fallback in
  `AppLayout` swapped from the literal `'[]'` to a books emoji;
  trailing `...` swapped for a real `…`.

### Removed

- **Dead route module** — `src/routes/AppRoutes.jsx` (the old
  `useRoutes`-based router) had no remaining importer; the live
  router has been `appRouter.jsx` (`createBrowserRouter`) for some
  time. Removed alongside the unused `.loading-bolt` rule that lived
  in both `auth.css` and the `index.html` critical CSS block.

## [Unreleased] — `claude/security-audit-frontend-VYk6d`

Portfolio polish + security hardening sweep. Ready to merge to `main`.

### Added

- **Scroll-driven landing hero** on the auth page — intro + four code
  panels (HTML → CSS → JS → React) + outro CTA, animated with a
  reusable `useInView` IntersectionObserver hook. No GSAP, no new
  deps, respects `prefers-reduced-motion`.
- **AI-generated practice quiz cards** — new
  `netlify/functions/practice-generate.js` gateway with authenticated
  OpenAI call, Postgres-backed rate limit, strict JSON schema
  validation on model output, and a UI in `SRPanel.jsx` to drop the
  generated card straight into the spaced-repetition queue.
- **Public `/u/:handle` profile pages** — opt-in, RLS-gated,
  read-only. New `public_profiles` SQL view projecting only display
  name, avatar, handle, XP, streak, lesson + badge counts. Opt-in
  toggle + unique-handle input in the user's private profile page.
- **Design system styleguide** at `/styleguide` — public, lazy-
  loaded page that renders every design token visually (colors,
  gradients, spacing, type, radii, sample components).
- **`useLocalStorage` hook** — SSR-safe, cross-tab synced, used by all
  persistent UI state (theme, sidebar collapse, lock mode, tasks,
  feedback, install dismiss, what's new seen, onboarded).
- **Vitest unit tests** for `gamificationService` and `learningEngine`
  (22 tests, green in 27 ms). Added `npm test` and `npm run typecheck`
  scripts.
- **Supply-chain hygiene**: committed `package-lock.json`, added
  `.github/workflows/security-audit.yml` (npm audit + gitleaks +
  typecheck + unit tests on every PR and weekly), added
  `.github/dependabot.yml` for weekly dependency + actions updates.
- **Docs**: new `SECURITY.md` with full threat model, `LICENSE`
  (MIT), `CONTRIBUTING.md`, `docs/setup-checklist.md`,
  `docs/architecture.md`, and a hiring-manager-ready `README.md`
  rewrite.
- **Self-hosted fonts** via `@fontsource-variable/inter`,
  `@fontsource/poppins`, `@fontsource/space-mono` (28 woff2 subsets
  bundled by Vite).
- **JavaScript services layer** — `src/services/*.js` with
  hand-written Supabase row/DTO contracts documented in service
  modules. React components stay JavaScript.
- **`/styleguide`** route (already covered above but worth repeating
  because it's a portfolio-first-impression artifact).

### Changed

- **CSS split** — `App.css` carved from 5,039 lines into 9 files:
  `tokens.css`, `base.css`, `animations.css`, `auth.css`,
  `sidebar.css`, `lessons.css`, `panels.css`, `landing.css`,
  `responsive.css`. `App.css` now holds only cross-cutting + smaller
  per-feature rules.
- **CSP** tightened — dropped `fonts.googleapis.com` from `style-src`
  and `fonts.gstatic.com` from `font-src` now that fonts are
  self-hosted. Added HSTS, COOP, CORP.
- **AI proxy** (`netlify/functions/ai.js`) — strict payload caps,
  mandatory server-side guardrail prefix, persistent Postgres-backed
  rate limit via `consume_ai_quota()`, fails closed if the rate
  limiter is unreachable.
- **Scheduled `streak-reminder` function** — now requires an
  `x-webhook-secret` for manual invocations, stopped logging user
  emails / display names.
- **README** — rewritten as hiring-manager ready: screenshot slot,
  "what I built and what it taught me" section, tech stack with
  rationale, architecture diagram, security highlights, scripts,
  design system link.

### Security

- **XSS fixes** — `renderMarkdown` (`src/utils/markdown.jsx`) now
  HTML-escapes before applying markdown substitution.
  `SearchPanel.highlight()` escapes both the source text and the
  query before regex replacement.
- **Content-Security-Policy** added to `netlify.toml` with Supabase,
  Monaco `wasm-unsafe-eval`, and `frame-ancestors 'none'`.
- **Strict-Transport-Security** (2y + preload),
  `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`,
  `Permissions-Policy`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`.
- **Persistent rate limit** for the AI proxy enforced in Postgres via
  a `SECURITY DEFINER` RPC that reads `auth.uid()` server-side so
  callers cannot spoof another user. Limits hardcoded in SQL.
- **Admin escalation guard** — Postgres trigger blocks direct
  `is_admin` edits. Promotions must go through `set_user_admin()`,
  which refuses self-edits and writes to `admin_audit_log`.
- **AI practice generator** (new endpoint) — same auth + rate-limit
  posture, server-pinned system prompt, topic allowlist, strict JSON
  schema validation on model output.
- **Supply chain** — committed lockfile, `npm audit` in CI,
  `gitleaks` secret scanning, Dependabot enabled.

### Fixed

- Deleted the broken `.github/workflows/ci.yml` that pointed at a
  non-existent `Downloads/codeherway-v2/` subdir and ran an
  undefined `npm test` script. `ci-smoke.yml` already covers the
  real CI.
- Fixed the `ops-checks.yml` live-site-health check that expected
  `HTTP 400 + "No AI input provided"` — the AI function has required
  auth since commit `8060c3d`, so unauthenticated POSTs now return
  `401 + "Authentication required"`. Updated the check to match
  reality.
- README was UTF-16LE (rendered oddly on GitHub) — rewrote as UTF-8.

### Removed

- `.github/workflows/ci.yml` (dead / broken, superseded by
  `ci-smoke.yml`).
- Google Fonts `@import` from `App.css` and preconnect hints from
  `index.html`.

---

## Earlier

Before the portfolio-polish branch, the repo was shipped as an
interactive coding education platform with four course tracks (HTML,
CSS, JS, React), a Python course, Monaco-backed code editor, AI
tutor, gamification (XP, streaks, badges, daily goals), spaced
repetition, bookmarks, notes, an admin dashboard, and PWA support.
See `git log main` for the full history of that work.


