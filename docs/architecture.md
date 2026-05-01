# Architecture

A practical walkthrough of how CodeHerWay is built. This is written for engineers reviewing the repo. For product positioning, see [README.md](../README.md). For threat model details, see [SECURITY.md](../SECURITY.md).

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

CodeHerWay now uses path-based routing with history state, plus a legacy hash migration layer.

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

<<<<<<< HEAD
## 6. Consolidation References

The notes below document approved reference-only materials used during
the repo consolidation. They are here to preserve decision context,
not to authorize additional migration scope.

### 6.1. Route Architecture References

Reference-only page inventory from
`codeherway-education-platform/src/pages/...` helped clarify the
desired route separation:

- Public entry surfaces:
  `landingPage.jsx`, `loginPage.jsx`, `signupPage.jsx`
- Authenticated app surfaces:
  `dashboardPage.jsx`, `profilePage.jsx`, `settingsPage.jsx`
- Admin surface:
  `adminPage.jsx`

What was useful:

- The scaffold repo made the public/app/admin split explicit.
- The public pages reinforced that landing and auth belong to the
  public side of the router, even when they share a shell.
- The app pages reinforced that profile/settings are authenticated
  route concerns, separate from the learning shell itself.
- The admin page confirmed the admin area should be a distinct route
  branch, not a special case buried in the main app path.

What was not adopted directly:

- No placeholder page implementations were copied.
- No mocked route logic or fake auth redirects were brought over.
- The canonical repo kept its stronger hash-based runtime and real
  `AuthProvider` / `profile.is_admin` checks.

### 6.2. Layout Architecture References

Reference-only layout files from
`codeherway-education-platform/src/layouts/...` were used as boundary
inspiration only:

- `publicLayout.jsx`
- `appLayout.jsx`
- `adminLayout.jsx`

What was useful:

- The source repo expressed a clean separation between public,
  authenticated app, and admin shells.
- That boundary model informed the current route/layout split:
  `PublicLayout`, `AppLayout`, and `AdminLayout`.

What was preserved from the canonical repo:

- The mature `AppLayout` remained the real authenticated app shell.
- `AuthLayout` remained responsible for the auth/guest-preview flow.
- New public/admin shells were kept intentionally lightweight so they
  wrap the stronger existing UI instead of replacing it with scaffold
  chrome.

### 6.3. UI Inventory References

Reference-only UI material from `codeherway-platform` was used to
document inventory and styling ideas:

- `src/components/ui/`
- `components.json`
- `src/App.css`

Inventory notes:

- `src/components/ui/` contains a large shadcn-style component set:
  overlays, form controls, navigation, feedback, data display, and
  layout primitives such as `dialog`, `drawer`, `dropdown-menu`,
  `navigation-menu`, `scroll-area`, `tabs`, `table`, `toast`, and
  `tooltip`.
- `components.json` confirms that inventory was built around a
  Tailwind + shadcn registry with path aliases for `components`,
  `ui`, `hooks`, and `lib`.

Styling notes from `src/App.css`:

- It showed strong emphasis on compact sidebar navigation, visible
  progress bars, quiz framing, search modal treatment, and dashboard-
  style stat cards.
- Those ideas were used only as visual reference while preserving the
  canonical repo's stronger modular CSS system in
  `src/styles/sidebar.css`, `src/styles/lessons.css`, and related
  files.

What was not adopted directly:

- No Tailwind/shadcn stack was imported.
- No `src/components/ui/` files were copied into the canonical repo.
- No localStorage-driven app shell behavior came across with the UI
  references.

---

## 7. Chunking strategy
=======
## 7. Performance strategy
>>>>>>> origin/main

- Domain-aware chunking in `vite.config.js` keeps first paint focused.
- Monaco editor is lazy loaded so first-run users do not pay editor cost up front.
- Admin views are lazy loaded and route-gated.
- Chunk budget checks (`npm run check:bundle`) protect against silent regressions.

---

<<<<<<< HEAD
## 8. What's NOT here (and why)
=======
## 8. Intentional non-goals

- No full framework rewrite.
- No heavyweight state library while current complexity remains manageable.
- No decorative visual effects that reduce clarity or accessibility.

CodeHerWay is intentionally evolved through small, test-validated changes that improve product quality without destabilizing the core learning experience.
>>>>>>> origin/main

