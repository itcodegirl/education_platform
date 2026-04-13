# Architecture

A walkthrough of how CodeHerWay is wired together. Aimed at engineers
reviewing the repo, not end users. For a shorter pitch see
[`README.md`](../README.md); for the threat model and security
controls see [`SECURITY.md`](../SECURITY.md).

---

## 1. High-level picture

```
 ┌─────────────────────────────────────────────────────────┐
 │                      Browser (React 18)                 │
 │  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐  │
 │  │  Landing  │  │   Learning   │  │  Styleguide /    │  │
 │  │  Hero     │  │   Shell      │  │  Public Profile  │  │
 │  └─────┬─────┘  └──────┬───────┘  └────────┬─────────┘  │
 │        │               │                   │             │
 │        └───────────────┴───────────────────┘             │
 │                          │                               │
 │                  ┌───────▼────────┐                      │
 │                  │ Supabase JS    │                      │
 │                  │ Auth + REST    │                      │
 │                  └───┬────┬───────┘                      │
 │                      │    │                              │
 │                      │    │  fetch /.netlify/functions/… │
 │                      │    │                              │
 └──────────────────────┼────┼──────────────────────────────┘
                        │    │
                 ┌──────▼┐  ┌▼────────────────────────────┐
                 │Supabase│  │      Netlify Functions      │
                 │Postgres│  │  ┌───────────┐ ┌──────────┐ │
                 │ + Auth │  │  │ /ai       │ │ /practice│ │
                 │ + RLS  │  │  │ (tutor)   │ │ -generate│ │
                 └───┬────┘  │  └─────┬─────┘ └─────┬────┘ │
                     │       │  ┌─────▼─────┐ ┌─────▼────┐ │
                     │       │  │ /streak-  │ │ verify + │ │
                     │       │  │ reminder  │ │ rate     │ │
                     │       │  │ (cron)    │ │ limit    │ │
                     │       │  └───────────┘ └─────┬────┘ │
                     │       └───────────────────────┼─────┘
                     │                                │
                     │       ┌────────────────────────▼────┐
                     │       │        OpenAI Responses API │
                     │       │        (server-side only)   │
                     │       └─────────────────────────────┘
                     │
                     └─ Row-Level Security on every table
                        (auth.uid() = user_id, admin override
                         via is_admin() security definer fn)
```

**Design invariants:**

1. **No secrets in the browser bundle.** Every sensitive key lives in
   Netlify environment variables. Client code only ships the Supabase
   anon key (designed to be public) and the Supabase URL.
2. **RLS is the only real authorization boundary.** The React UI is
   convenience; the database enforces access.
3. **Every outbound call to a paid API goes through a gateway
   function** that verifies a Supabase session, rate-limits per
   user (in Postgres), caps payload size, and prepends a server-pinned
   guardrail prompt.
4. **Fail closed.** If any security dependency (rate limiter,
   session check) is unreachable, the request is rejected — never
   forwarded unprotected.

---

## 2. Request lifecycles

### 2.1. A learner opens the site (logged out)

```
1. Browser fetches index.html
   → Netlify edge serves it with the full security header suite
     (CSP, HSTS, COOP, CORP, Frame-Options, Referrer, Permissions)
2. Vite bundle hydrates React 18
3. AppRoutes sees no user, renders <AuthLayout> → <AuthPage>
4. AuthPage renders <LandingHero> above the auth card
5. LandingHero's IntersectionObserver fires as the user scrolls,
   toggling `.in-view` on each panel to trigger CSS transitions
6. "Start learning free" button smooth-scrolls the auth card into view
   and flips the mode to signup
```

No database calls until the user submits the form. Nothing
authenticated, nothing personal fetched.

### 2.2. A learner signs in

```
1. AuthPage → authService.signInWithEmail(email, password)
2. Supabase Auth validates credentials, returns { session, user }
3. AuthContext updates → AppRoutes re-renders → AppLayout mounts
4. ProgressContext fires fetchAllUserData(user.id) which runs 11
   RLS-scoped SELECTs in parallel (progress, quiz_scores, xp,
   streaks, daily_goals, badges, sr_cards, bookmarks, notes,
   courses_visited, last_position)
5. Each query goes directly to Supabase; RLS policies filter rows
   so the user only ever sees their own data. The React code isn't
   the guard — the database is.
```

### 2.3. A learner asks the AI tutor a question

```
1. AITutor.jsx → aiService.askLessonTutor({ system, history, question })
2. aiService grabs the current access_token from supabase.auth.getSession()
3. POST /.netlify/functions/ai with Authorization: Bearer <jwt>
4. Netlify Function verifies the JWT via POST /auth/v1/user
5. Hot-instance in-memory rate limit (defense in depth)
6. POST /rest/v1/rpc/consume_ai_quota with the user's JWT
   → Postgres SECURITY DEFINER function reads auth.uid() server-side
     so the user cannot spoof another user's id
   → atomic upsert: 10 requests / 60 seconds, hardcoded in SQL
   → returns boolean; if null (RPC unreachable), function returns 503
7. Parse + validate payload (system ≤ 2KB, ≤ 20 messages, ≤ 4KB each,
   ≤ 12KB total, ≤ 1024 output tokens)
8. Prepend mandatory server-side guardrail prefix to the system prompt
9. POST to OpenAI Responses API with the composed input
10. Return { text } to the client. The client renders it as escaped
    text — NEVER via dangerouslySetInnerHTML.
```

The OpenAI API key never leaves the server. The function fails
closed on every security dependency.

### 2.4. A learner generates an AI practice card

Identical to 2.3 except:

- Endpoint: `/.netlify/functions/practice-generate`
- Input: `{ topic: "react", concept: "useEffect cleanup" }`
- Topic is checked against an allowlist (`html|css|js|react|python`)
- **System prompt is pinned server-side** — the client cannot send
  one. The prompt instructs the model to return a strict JSON object
- Output is parsed, code-fence-stripped, and validated against a
  schema: `{ question, code?, options[4], correct 0..3, explanation }`
- Invalid shapes return 502 rather than forwarding a malformed card
- Valid cards are returned to the client, which calls
  `addToSRQueue([card])` to insert into `sr_cards` via Supabase

### 2.5. A visitor views a public profile (no auth)

```
1. Browser hits /#u/jenna
2. AppRoutes.parsePublicProfileHash() validates the handle regex
   ([A-Za-z0-9_-]{2,30}) and lazy-loads <PublicProfile>
3. PublicProfile fetches from the public_profiles VIEW via the
   anon-key Supabase client
4. The VIEW projects only: display_name, avatar_url, handle,
   xp_total, streak_days, lessons_completed, badges_earned
5. Base-table RLS policies gate anon reads on
     is_public = true AND is_disabled = false
   so disabled accounts disappear from the public view immediately
6. Email, per-lesson progress, notes, bookmarks never leave the DB
```

---

## 3. Folder map

```
src/
├── App.jsx                    # Providers → Routes (24 lines)
├── main.jsx                   # StrictMode + ErrorBoundary + chunk-reload recovery
│
├── routes/AppRoutes.jsx       # Hash-based routing: styleguide → u/:handle → auth → admin → shell
├── layouts/
│   ├── AppLayout.jsx          # Sidebar + Topbar + Content + Toolbar
│   └── AuthLayout.jsx         # Landing hero + auth card, or guest preview
│
├── providers/                 # Auth, Theme, Progress context providers
├── context/                   # Context definitions + BADGE_DEFS + progress state reducer
│
├── services/                  # TypeScript — DB / AI / auth / gamification / learning-engine
│   ├── supabaseTypes.ts       # Hand-written row / DTO types
│   ├── authService.ts
│   ├── aiService.ts           # Client → /.netlify/functions/ai
│   ├── practiceService.js     # Client → /.netlify/functions/practice-generate
│   ├── progressService.ts     # All Supabase CRUD
│   ├── gamificationService.ts # Pure XP + badge eligibility math
│   └── learningEngine.ts      # Lesson / quiz / challenge orchestration
│
├── components/
│   ├── auth/                  # AuthPage, LandingHero, GuestPreview
│   ├── learning/              # LessonView, CodePreview, QuizView, AITutor, CodeChallenge
│   ├── panels/                # Search, Cheatsheet, Glossary, Bookmarks, SR, Badges, …
│   ├── layout/                # Sidebar, Topbar, BottomToolbar, Breadcrumb, ThemeToggle
│   ├── shared/                # Logo, ErrorBoundary, ProfilePage, PublicProfile, Styleguide
│   ├── admin/                 # AdminDashboard, LessonBuilder
│   └── gamification/          # XPPopup, BadgeUnlock, CourseComplete, Confetti
│
├── hooks/                     # useIsMobile, useKeyboardNav, useNavigation, usePanels,
│                              # useLocalStorage, useInView
├── utils/                     # markdown (HTML-escaped!), iframeStyles, monacoTheme, helpers
├── lib/supabaseClient.js      # Single Supabase client instance
│
├── data/                      # Course content (40+ module files)
│   ├── html/ css/ js/ react/ python/
│   │   ├── course.js          # Module list
│   │   ├── quizzes.js
│   │   ├── challenges.js
│   │   └── modules/*.js|.json
│   └── reference/             # Cheatsheets, glossary, projects, search index
│
└── styles/                    # 9 CSS modules (see §4)
```

```
netlify/functions/
├── ai.js                      # Auth'd OpenAI proxy, rate-limited, guardrail prefix
├── practice-generate.js       # Auth'd practice card generator, JSON schema validated
└── streak-reminder.js         # Daily cron, shared-secret for manual invocations
```

```
supabase-schema.sql            # 12 tables, RLS policies, triggers, RPCs, audit log
```

---

## 4. Styles architecture

The design system lives in tokens; components consume tokens by
referencing CSS custom properties. Nothing hardcodes a hex value or
a magic pixel number.

```
src/styles/
├── tokens.css                 # :root — colors, gradients, 8pt spacing,
│                              # fluid type with clamp(), radii, motion
├── base.css                   # reset, body, focus rings, skip link, reduced-motion
├── animations.css             # shared @keyframes (fade, slide, pulse, glow)
│
├── auth.css                   # auth page + loading screen
├── sidebar.css                # glassmorphism sidebar, module tree, profile popover
├── lessons.css                # lesson view, notes, code preview, quiz, search
├── panels.css                 # cheatsheet, glossary, SR, bookmarks, nav bar,
│                              # AI practice generator, public profile
├── landing.css                # scroll-driven landing hero
├── responsive.css             # mobile + tablet breakpoints
│
└── App.css                    # cross-cutting: shell, topbar, XP bar, stats,
                               # XP popup, theme toggle, light theme, course accents,
                               # welcome back, course complete, confetti, print,
                               # quiz meta, scrollbar, structured lesson format
```

Preview every token live at **`/#styleguide`**.

---

## 5. Build + CI

| Stage | Tool | Runs on |
| --- | --- | --- |
| Dev server | Vite | `npm run dev` |
| Production build | Vite + Rollup (manual chunk config) | `npm run build`, Netlify deploy |
| Typecheck | `tsc --noEmit` | `npm run typecheck`, `security-audit.yml` |
| Unit tests | Vitest (Node env, 22 tests) | `npm test`, `security-audit.yml` |
| E2E tests | Playwright (Chromium) | `npm run test:e2e`, `ci-smoke.yml` |
| Dependency audit | `npm audit --audit-level=high` | `security-audit.yml` (every PR) + `ops-checks.yml` (weekly) |
| Secret scanning | `gitleaks` | `security-audit.yml` (every PR) |
| Dependency updates | Dependabot | Weekly |
| Live-site health | `curl` against production | `ops-checks.yml` (weekly) |

---

## 6. Chunking strategy

`vite.config.js` manually chunks to keep the initial bundle small and
course-scoped:

- `vendor-react` — React core (shared across everything)
- `vendor-supabase` — Supabase JS client
- `vendor-jspdf` — PDF generator (only loaded when certificate is generated)
- `data-html` / `data-css` / `data-js` / `data-react` / `data-python` —
  each course's lessons + quizzes + challenges as its own chunk
- `data-reference` — cheatsheets, glossary, projects (shared)

Plus lazy-loaded single-purpose chunks:
- `AdminDashboard` (only loaded for admins)
- `LessonBuilder` (only loaded inside admin)
- `ProfilePage`
- `Styleguide` (public, no auth)
- `PublicProfile` (public, no auth)
- `MonacoEditor` (~200 KB, lazy on the first code preview)

And a fallback chunk-load error recovery in `main.jsx` that force-
refreshes once if a deploy invalidates a dynamic chunk while a tab
is still open.

---

## 7. What's NOT here (and why)

- **No Redux / Zustand / TanStack Query.** State lives in React
  Context — progress, theme, auth. The app is small enough that a
  global store is overhead. If this scales to 10× the courses, a
  query cache is the first thing I'd add.
- **No SSR.** This is a single-page PWA; the content is highly
  personalized and interactive. SSR would buy nothing. The landing
  hero's OG tags and the `#u/:handle` profile pages would benefit
  from edge rendering if we wanted Twitter/LinkedIn link previews to
  be per-user, but that's a future feature.
- **No Tailwind.** Deliberate. This is a teaching project for people
  learning CSS; raw `:root` tokens + component-level CSS modules read
  better than utility classes for that audience.
- **No React component TypeScript yet.** Services are `.ts`; the
  React layer stays `.jsx` to keep the JSX teaching surface readable.
  When the component tree is migrated, it'll happen in small PRs
  (hooks first, then leaves, then layouts).
