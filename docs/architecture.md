# Architecture

A practical walkthrough of how Cinova is built. This is written for engineers reviewing the repo. For product positioning, see [README.md](../README.md). For threat model details, see [SECURITY.md](../SECURITY.md).

---

## 1. System overview

```text
Browser (React 18 + Vite)
  |
  +-- Route shell and feature panels
  |
  +-- Supabase JS client
       |- Auth session management
       |- Postgres reads/writes (RLS enforced)
  |
  +-- Netlify Functions
       |- /.netlify/functions/ai
       |- /.netlify/functions/practice-generate
       |- /.netlify/functions/streak-reminder
  |
  +-- OpenAI Responses API (server-side only)
```

Design invariants:

1. No secrets in the browser bundle.
2. RLS is the true authorization boundary.
3. Paid AI calls are server mediated and rate limited.
4. Security-critical dependencies fail closed.

---

## 2. Route model and navigation

Cinova now uses path-based routing with history state, plus a legacy hash migration layer.

| Path | Behavior |
| --- | --- |
| `/` | Auth layout when signed out, app shell when signed in |
| `/learn/:course/:module/:lesson` | Deep-linked lesson state |
| `/profile` | Signed-in profile page |
| `/admin` | Admin dashboard (gated by admin route + backend auth) |
| `/u/:handle` | Public profile page |
| `/styleguide` | Design token/style reference page |

Compatibility detail:

- `src/routes/routeUtils.js` maps legacy hashes (like `#admin` or `#u/handle`) to path routes and replaces history state to keep old links from breaking.

---

## 3. Request lifecycles

### 3.1 Logged-out visitor

1. Browser loads `index.html` with security headers configured in `netlify.toml`.
2. React hydrates and `AppRoutes` resolves session state.
3. If no user session exists, `AuthLayout` renders landing + auth entry.

### 3.2 Sign-in flow

1. `AuthPage` calls `authService.signInWithEmail(...)`.
2. Supabase Auth returns session + user.
3. `AuthContext` updates, app shell mounts.
4. Progress context fetches user-scoped data from Supabase in parallel.
5. RLS enforces row-level access in the database.

### 3.3 AI tutor request

1. Client calls `aiService.askLessonTutor(...)`.
2. Client sends bearer token to `/.netlify/functions/ai`.
3. Function verifies session, applies limits, validates payload.
4. Function prepends guardrail prompt and calls OpenAI Responses API.
5. Sanitized text response returns to the client.

### 3.4 Public profile request

1. Browser hits `/u/:handle`.
2. Handle format is validated.
3. Public profile view returns only approved public fields.
4. Private user data stays protected by RLS policies.

---

## 4. Repository map

```text
src/
  App.jsx
  main.jsx
  routes/
    AppRoutes.jsx
    routeUtils.js
  layouts/
    AppLayout.jsx
    AuthLayout.jsx
  providers/
  context/
  services/
    aiService.js
    authService.js
    gamificationService.js
    learningEngine.js
    practiceService.js
    progressService.js
  components/
    auth/
    learning/
    panels/
    layout/
    shared/
    admin/
    gamification/
  hooks/
  utils/
  lib/supabaseClient.js
  data/
  styles/
```

Functions:

```text
netlify/functions/
  ai.js
  practice-generate.js
  streak-reminder.js
```

Database schema and policies:

```text
supabase-schema.sql
```

---

## 5. Styling architecture

The UI uses tokenized CSS variables and shared component patterns.

- Tokens: `src/styles/tokens.css`
- Base/focus/motion foundations: `src/styles/base.css`, `src/styles/animations.css`
- Domain styles: `auth.css`, `lessons.css`, `panels.css`, `sidebar.css`, `landing.css`, `responsive.css`
- Cross-cutting shell styles remain in `src/styles/App.css`, with incremental extraction strategy applied over time

Live token preview route: `/styleguide`.

---

## 6. Build and quality workflow

| Stage | Tooling | Command |
| --- | --- | --- |
| Local dev | Vite | `npm run dev` |
| Production build | Vite + Rollup | `npm run build` |
| Lint | ESLint | `npm run lint` |
| Unit tests | Vitest | `npm run test:unit` |
| Integration/E2E | Playwright | `npm run test:integration` |
| Bundle budgets | custom script | `npm run check:bundle` |
| Quality gate | lint + build + bundle + unit | `npm run check` |
| CI gate | quality gate + integration/E2E | `npm run check:ci` |
| Security audit | npm audit + secret scanning | GitHub Actions workflows |

---

## 7. Performance strategy

- Domain-aware chunking in `vite.config.js` keeps first paint focused.
- Monaco editor is lazy loaded so first-run users do not pay editor cost up front.
- Admin views are lazy loaded and route-gated.
- Chunk budget checks (`npm run check:bundle`) protect against silent regressions.

---

## 8. Intentional non-goals

- No full framework rewrite.
- No heavyweight state library while current complexity remains manageable.
- No decorative visual effects that reduce clarity or accessibility.

Cinova is intentionally evolved through small, test-validated changes that improve product quality without destabilizing the core learning experience.
