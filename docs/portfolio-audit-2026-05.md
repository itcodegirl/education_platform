# CodeHerWay Portfolio Audit — May 2026

Scope: canonical repository `itcodegirl/education_platform` only. Archived CodeHerWay
repositories were not evaluated and are treated as historical references.

Posture under review: portfolio/demo-ready frontend learning platform — **not** a
production SaaS or credentialing system. The goal of this audit is to make the
project a clear, credible, recruiter-friendly case study **without overstating
production readiness**.

Priority legend:

- 🔴 Critical: fix before portfolio presentation
- 🟡 Important: improves credibility / UX
- ⚪ Optional: polish or future enhancement

---

## 1. Repository identity and source-of-truth clarity — 🟡

**Current state.** README, `docs/reviewer-start-here.md`, `docs/trust-boundaries.md`,
and `docs/repository-canonicalization-checklist.md` all clearly name
`itcodegirl/education_platform` as the canonical app and label archived repos as
historical. `package.json` name is `codeherway-platform`. JSON-LD `sameAs` in
`index.html` points at this repo.

**Working.** Canonical notice is repeated consistently and is the first thing a
reviewer sees.

**Broken/risky.** `index.html` `sameAs`/`og:url` reference `codeherway.com`, but no
README link confirms that domain is live; if it isn't, the structured data is
aspirational. Several docs reference "this PR" as though the audit were a single
in-flight change, which reads oddly in a long-lived repo.

**Overstated.** Nothing major in this area.

**Remove/pause/simplify.** Collapse the canonical notice to one place (README +
`reviewer-start-here`) and link to it instead of repeating it verbatim across five
files.

**Highest-priority fix.** Confirm whether `codeherway.com` resolves to this build; if
not, drop the live-domain URLs from `index.html`/JSON-LD or mark them clearly as
"planned domain."

**Acceptance criteria.** A reviewer landing on the repo root knows within 30 seconds
which repo is canonical, whether there is a live deploy, and where to start — without
opening more than one doc.

**Inspect.** `README.md`, `docs/reviewer-start-here.md`,
`docs/repository-canonicalization-checklist.md`, `index.html`.

**Commands.** `npm run check:supabase-readiness` (also enforces some doc presence).

**Recruiter impact.** Medium — clarity here is the difference between "organized" and
"which repo is this again?"

**User impact.** Low.

---

## 2. Branch and PR health — 🔴

**Current state.** Open PRs: `#90` (`codex/security-trust-hardening`, "Fix CI
dependencies and improve learner trust and navigation"). Remote branches still
include `copilot/audit-education-platform`, `copilot/close-open-branches`,
`copilot/explore-codebase-implementation-plan`, `copilot/full-project-audit-review`,
`copilot/full-project-audit-review-again`, plus several `codex/*` branches. Locally
there are many more parked `codex/*` and `feat/*` branches.

**Working.** `docs/branch-triage.md` exists and explains parked branches.

**Broken/risky.** `docs/branch-triage.md` ("Last reviewed: May 7, 2026") triages PRs
**#41/#42/#43**, none of which are open anymore; the only open PR is #90, which the
doc doesn't mention. The doc is stale and actively misleads a reviewer who follows
README's "branch and PR triage" link. The five `copilot/*` remote branches plus
duplicate `...-review` / `...-review-again` branches read as abandoned bot output.

**Overstated.** "Review open PRs in this order: #42, #43, #41" — those PRs don't exist.

**Remove/pause/simplify.** Delete the `copilot/*` remote branches and any merged
`codex/*` remotes. Either merge/close PR #90 or describe it in the triage doc.

**Highest-priority fix.** Refresh `docs/branch-triage.md` to reflect reality (PR #90
+ whatever remote branches survive cleanup) **or** delete it and replace with a one-
line "no parked branches; all work is on `main`" note once cleanup is done.

**Acceptance criteria.** `git branch -r` shows `main` plus at most the active feature
branch; `docs/branch-triage.md` either matches the live branch/PR list or is gone;
README's link doesn't point at stale triage.

**Inspect.** `docs/branch-triage.md`, GitHub branch/PR list.

**Commands.** `git branch -r`; `npm run check` on each surviving branch before merge.

**Recruiter impact.** High — a wall of `copilot/full-project-audit-review-again`
branches and a triage doc that references nonexistent PRs is the single most
"unfinished" signal in the repo.

**User impact.** None directly.

---

## 3. Product positioning and public copy — 🔴

**Current state.** README/docs consistently say "portfolio/demo-ready, not
production-grade." But `index.html` meta + Open Graph + JSON-LD describe CodeHerWay as
"a free, browser-based **coding bootcamp** for women who learn by building real
projects with an AI tutor, live code editor, and **auto-graded challenges**."
`LandingHero.jsx` copy ("ship something real", "Build real apps with React") is in the
same energetic register.

**Working.** The audience framing (women entering tech, beginner-friendly, build-by-
doing) is clear and consistent; the four-track ladder (HTML → CSS → JS → React) is a
genuinely good narrative spine.

**Broken/risky.** "Bootcamp" implies cohorts, instructors, outcomes, and possibly
job-placement expectations none of which exist. "Auto-graded challenges" is only
partly true (HTML uses DOM checks; CSS mixes computed-style + source regex; JS/React
use console capture — and `:hover`/`@media`/`@keyframes` are regex-only). The public-
facing copy and the internal honesty docs disagree about how strong the product is.

**Overstated.** "Coding bootcamp"; the implied completeness of "auto-graded."

**Remove/pause/simplify.** Replace "bootcamp" with "self-paced learning platform" /
"interactive course." Soften "auto-graded challenges" to "practice challenges with
instant feedback" or add the same honesty caveat the in-app `CodeChallenge` UI
already carries.

**Highest-priority fix.** Bring `index.html` meta/OG/Twitter/JSON-LD descriptions in
line with the README posture and the in-app honesty notes. (PR #90 already touches
some of this — verify it lands the de-escalated copy and doesn't reintroduce
"bootcamp.")

**Acceptance criteria.** No public-facing string claims credentialing, cohorts, job
outcomes, or fully automated grading; OG/meta copy matches `README.md` and
`KNOWN_LIMITATIONS.md`; `LandingHero` CTA points at the first-lesson preview (it now
does — keep it).

**Inspect.** `index.html`, `src/components/auth/LandingHero.jsx`,
`src/components/auth/GuestPreview.jsx`, `README.md` first section.

**Commands.** `npm run build` then grep `dist/index.html` for "bootcamp"/"certificate".

**Recruiter impact.** High — a recruiter who diff-checks the marketing copy against
the limitations doc will notice the mismatch; aligning them turns "overclaims" into
"disciplined honesty," which is the whole pitch of this case study.

**User impact.** Medium — sets accurate expectations so learners aren't surprised the
"bootcamp" is a single-device self-study app.

---

## 4. Learner journey and onboarding clarity — 🟡

**Current state.** Public landing (`LandingHero`) → guest first-lesson preview
(`GuestPreview` / `GuestPreviewRoute`) → auth (`AuthPage`, email + optional OAuth) →
`Onboarding` → dashboard/lesson flow; returning users get `WelcomeBack` with a streak-
recovery cue. README/case study say the first 30–60s were a focus area.

**Working.** Guest can preview a real lesson before signing up — strong conversion
pattern. `WelcomeBack` surfacing a paused streak as "pick it back up" is a thoughtful
retention touch. Empty states were explicitly improved.

**Broken/risky.** With four full courses and ~90 modules, "what do I do next?" can
still be ambiguous on the dashboard — worth a quick heuristic check that there is one
obvious primary CTA ("Continue" or "Start HTML") above the fold. Onboarding copy
should not promise cross-device sync (see area 10/11).

**Overstated.** "Guided first 30–60 seconds" — verify the dashboard actually
single-points the next action rather than presenting all tools at once.

**Remove/pause/simplify.** If the dashboard shows bookmarks/notes/review/badges with
equal weight on first login, demote them behind the primary "continue learning" CTA.

**Highest-priority fix.** Confirm (and screenshot for the case study) a single
unambiguous next-step CTA on first authenticated load and on return.

**Acceptance criteria.** A first-time signed-in user reaches "I'm in lesson 1" in ≤2
clicks from auth; a returning user sees "Continue: <lesson>" as the top action.

**Inspect.** `src/components/onboarding/Onboarding.jsx`, `WelcomeBack.jsx`,
`src/routes/ProtectedAppRoutes.jsx`, the dashboard/home panel under `src/components/panels`.

**Commands.** `npm run dev` and walk landing → preview → auth → dashboard;
`npm run test:e2e:smoke:public`.

**Recruiter impact.** Medium-high — "I made onboarding obvious" is a claim recruiters
will spot-check live.

**User impact.** High — directly affects activation.

---

## 5. Information architecture and routing — 🟡

**Current state.** Single React Router data-router (`src/routes/appRouter.jsx`) with
`ProtectedRoute`, `AdminRoute`, `GuestPreviewRoute`, `PublicProfileRoute`, a
`RouteErrorBoundary`, plus `learnRouteActions.js` / `learnRouteRecovery.js` for lesson
mutations. README notes the legacy route tree was removed.

**Working.** One clear router architecture; route-level error boundary plus a
top-level `ErrorBoundary` in `App.jsx`; recoverable route mutations feed the retry
queue. Recent commits hardened route resilience and admin access checks.

**Broken/risky.** Route surface is broad (admin, public profile, guest preview,
authenticated app, lesson sub-routes) for a demo; each adds a thing a reviewer can
break. Public profile route exposes aggregate-only data (good) but is another
public surface to keep honest.

**Overstated.** Nothing major.

**Remove/pause/simplify.** Consider whether the public-profile route earns its keep in
a demo, or whether it should be gated/feature-flagged until it's clearly more than a
stub.

**Highest-priority fix.** Make sure every top-level route has a sane fallback (404,
unauthorized, error) and that `RouteErrorBoundary` is wired on each — looks done; add
an E2E that hits an unknown path and asserts a real 404 screen.

**Acceptance criteria.** No route renders a blank page on error; unknown paths show a
404 with a way home; admin routes are inaccessible to non-admins (tested).

**Inspect.** `src/routes/appRouter.jsx`, `src/routes/guards/*`,
`src/routes/RouteErrorBoundary.jsx`, `src/routes/PublicProfileRoute.jsx`.

**Commands.** `npm run test:unit` (route tests exist), `npm run test:e2e`.

**Recruiter impact.** Medium — clean routing reads as competent.

**User impact.** Medium.

---

## 6. Curriculum structure — 🟡

**Current state.** Four tracks. CSS (`src/data/css/modules/*.json`, 4 modules) and JS
(`src/data/js/modules/*.json`, 6 modules) are on the structured lesson format. HTML is
mixed (4 `.json` structured modules mounted by the manifest, plus many legacy `.js`
module files still in the folder). React (`src/data/react/modules/*.js`, ~24 module
files / ~41 lessons) is entirely on the legacy `RichLessonBody` format. The old Python
track was removed (documented).

**Working.** Clear progression; content audit gate (`npm run audit:content`) blocks
stale prerequisites and implicit cross-course handoffs; reward catalog audit keeps the
Supabase reward catalog in sync with curriculum.

**Broken/risky.** Two lesson formats coexist. A learner finishing JS and starting
React sees the lesson surface change — `docs/handoff-deferred-risks.md` itself calls
this "the single strongest 'demo, not product' signal." The HTML `modules/` folder
contains both the active `.json` modules and a large set of unreferenced legacy `.js`
files, which is confusing for a reviewer browsing source.

**Overstated.** "Four full courses" is fair, but the React course's depth/format is
not at parity with HTML/CSS/JS.

**Remove/pause/simplify.** Delete (or move to an `legacy/` / `archive/` subfolder) the
unreferenced HTML `modules/*.js` files so the active curriculum source is
unambiguous. Don't mechanically convert React lessons (would degrade quality) — but do
land the CI guard below.

**Highest-priority fix.** Add `scripts/audit-lesson-format.mjs` (per the handoff doc),
wire it into `npm run check:quality`, and migrate **one** React module to the
structured format as a worked reference. This locks the direction without a rewrite.

**Acceptance criteria.** No new course module can ship in the legacy shape; the HTML
`modules/` folder contains only files the manifest imports; at least one React module
demonstrates the structured format.

**Inspect.** `src/data/{html,css,js,react}/course.js`, `src/data/html/modules/`,
`src/data/react/modules/`, `src/components/learning/LessonView.jsx`,
`docs/handoff-deferred-risks.md`.

**Commands.** `npm run audit:content`, `npm run audit:reward-catalog`,
`npm run audit:lesson-labels`.

**Recruiter impact.** Medium — a reviewer who opens `src/data` sees the dual format
and the dead legacy files quickly.

**User impact.** Medium — format whiplash entering the React track.

---

## 7. Lesson quality — 🟡

**Current state.** Structured lessons (`StructuredLessonBody`) have hook/do/understand/
build/challenge/summary/bridge with named concepts + analogies and step-by-step `do`
instructions; legacy lessons (`RichLessonBody`) have concepts/code/output/tasks/
challenge/devFession. Heading-order is unit-tested for both renderers.

**Working.** Structured lessons are genuinely well-designed pedagogically; both
renderers share the lesson shell (bookmark, notes, AI tutor, quiz, prev/next).
Accessibility/heading tests guard regressions.

**Broken/risky.** Legacy React lessons are thinner (bullet prose, single-paragraph
challenges, no `bridge` preview). The "devFession" device only exists in legacy
lessons, so tone differs between tracks.

**Overstated.** Nothing systemic; the case study is honest that React is legacy-format.

**Remove/pause/simplify.** No removals — but pin the structured format as the standard
(area 6).

**Highest-priority fix.** Same as area 6 — the format gate + one migrated React module
is the highest-leverage lesson-quality move.

**Acceptance criteria.** New lessons are structured; the migrated React reference
module reads as well as a CSS/JS lesson.

**Inspect.** `src/components/learning/StructuredLessonBody.jsx`, `RichLessonBody.jsx`,
their `.headings.test.jsx` files, a sample `src/data/js/modules/*.json` vs
`src/data/react/modules/*.js`.

**Commands.** `npm run test:unit`, `npm run audit:content`.

**Recruiter impact.** Low-medium.

**User impact.** Medium.

---

## 8. Quiz integrity — 🟡

**Current state.** Active lesson-quiz coverage is complete for all four tracks.
`npm run audit:quizzes --strict` (default, also in CI without `continue-on-error`)
fails on unclassified orphan quizzes / unreviewed variant groups: 14 variant groups
locked, 53 legacy orphans classified and non-blocking. Cross-course mixed-type quiz
entries previously in React data are archived as inactive exports. `QuizView` now
accepts `legacyQuizKeys` to prevent duplicate XP across renamed keys (PR #90).
Single-answer questions use native radio semantics.

**Working.** Strict CI gate; explicit classification of orphans/variants instead of
ambiguity; stable quiz keys so reward milestones survive copy edits.

**Broken/risky.** 53 classified-but-still-present orphan quizzes is a meaningful
backlog — "classified" is honest but not the same as "cleaned up." A reviewer reading
the audit output sees 53 orphans and 14 variant groups, which needs context to not
look like rot.

**Overstated.** "Quiz integrity" is well-handled; just make sure the README phrasing
("complete") refers to *active* coverage, which it does.

**Remove/pause/simplify.** Triage the 53 orphans: delete the ones that are truly dead,
keep + document the ones that are intentional aliases. Even reducing 53 → ~20 with a
short rationale list would strengthen the story.

**Highest-priority fix.** Add a short `docs/quiz-inventory.md` (or expand the audit
report header) explaining what "orphan" and "variant group" mean and why the
remaining ones exist — so the number is self-explanatory.

**Acceptance criteria.** `npm run audit:quizzes` passes strict; the orphan count is
either reduced or each remaining orphan has a one-line documented reason; native
form semantics verified by the existing a11y tests.

**Inspect.** `scripts/audit-quiz-integrity.mjs`, `scripts/quiz-orphan-registry.mjs`,
`scripts/quiz-variant-registry.mjs`, `src/components/learning/QuizView.jsx`,
`src/components/learning/quiz/questionTypes.jsx`, `src/hooks/useQuizSession.js`.

**Commands.** `npm run audit:quizzes`, `npm run test:unit`.

**Recruiter impact.** Medium — the strict CI gate is a good signal; the bare "53
orphans" line needs framing.

**User impact.** Low.

---

## 9. Challenge integrity — 🟡

**Current state.** HTML challenges grade via live DOM queries on the iframe document
(comments stripped before `querySelector`). CSS challenges mix `getComputedStyle` for
structural properties with source-regex for `:hover`/`:focus`/`@keyframes`/`@media`.
JS/React challenges capture console output. The `CodeChallenge` UI states the grading
basis explicitly. The session hook waits for iframe `onLoad` before grading. Challenge
completion is deduped same-device and persisted in `localStorage`.

**Working.** Honest in-UI disclosure of what the grader checks; DOM-based HTML grading
is genuinely harder to game than substring checks; retry-safe XP.

**Broken/risky.** CSS regex checks can be fooled (e.g. a `:hover` rule in a comment or
a string). Challenge completion is `localStorage`-only — not secure, not cross-device;
the README says so but the topbar XP/level reflects these completions, which can
*look* authoritative. Only one challenge (`html-ch-1`) demonstrates the migrated
session-hook pattern per the README; coverage of the new pattern across all challenges
should be confirmed.

**Overstated.** None in copy — but watch that no public string calls challenges
"verified" or "certified."

**Remove/pause/simplify.** Don't try to make CSS pseudo-selector grading bulletproof
in a static iframe — keep the disclosure. Consider hiding raw challenge "score" from
any export/PDF.

**Highest-priority fix.** Confirm every active challenge uses the `useChallengeSession`
+ onLoad-before-grade lifecycle (not just `html-ch-1`); if some still grade before
load, that's a real correctness bug.

**Acceptance criteria.** All challenges grade after iframe load; the grading-basis
note is present on every challenge; no export presents challenge results as a
credential.

**Inspect.** `src/components/learning/CodeChallenge.jsx`,
`src/hooks/useChallengeSession.js`, `src/components/learning/challenge/`,
`src/data/html/challenges.js`, the other tracks' `challenges.js`.

**Commands.** `npm run test:unit`, `npm run test:e2e:smoke:lesson`.

**Recruiter impact.** Medium — the honesty note is a plus; partial migration coverage
is a minor minus.

**User impact.** Medium — wrong pass/fail on a CSS challenge hurts trust.

---

## 10. Progress tracking — 🟡

**Current state.** `ProgressContext` runs a dual-layer optimistic + canonical model.
Lesson completions / bookmarks / notes sync to Supabase when connected; failed
recoverable writes (direct optimistic writes, plus lesson-completion and bookmark
route mutations) enter a same-browser retry queue with manual retry, reconnect retry,
and next-session replay. Saved learning position now writes stable
`courseId/moduleId/lessonId/isModuleQuiz` with legacy-label fallback;
`audit:lesson-labels` blocks renames until a stable-ID migration lands. Streak/daily-
count have display guards (`getActiveStreakDays`, `getActiveDailyCount`) so a lapsed
streak shows 0 rather than a stale value, with `useTodayKey` re-evaluating at midnight.

**Working.** This is the strongest engineering area: the retry queue, the stable-ID
resume path, the midnight-aware display guards, and the learner-scoped local storage
keys are all well thought out and tested.

**Broken/risky.** Not everything is in the retry queue — non-recoverable route
failures and backend reward writes still surface advisory-only sync warnings. The
saved-position DB column still stores human-readable labels for legacy rows; until the
C2 stable-ID migration lands, a label rename without a paired migration can drop a
learner to lesson 1.

**Overstated.** README/onboarding must keep saying "saved on this device" for
XP/streaks/badges/review/challenges (it currently does) — don't let UI copy drift to
implying cloud durability.

**Remove/pause/simplify.** Nothing to remove. Land the C2 stable-ID migration to
retire the label-matching fallback.

**Highest-priority fix.** Ship the stable `(courseId, moduleId, lessonId)` resume
migration so `audit:lesson-labels` can stop being a freeze on renames; it's already
half-done (writer emits stable fields, resolver prefers them, test exists).

**Acceptance criteria.** Resume works from a stable-ID-only row (test exists — make it
the production shape); `audit:lesson-labels` becomes informational rather than a hard
freeze; streak/daily guards covered by tests (they are).

**Inspect.** `src/context/ProgressContext.jsx`, `src/hooks/useProgressSync.js`,
`src/utils/savedPosition.js`, `src/utils/helpers.js` (`getActiveStreakDays`),
`src/utils/learnerLocalStore.js`, `src/routes/learnRouteActions.js`.

**Commands.** `npm run test:unit`, `npm run audit:lesson-labels`,
`npm run check:supabase-readiness`.

**Recruiter impact.** High — this is the area most worth showing a senior reviewer.

**User impact.** High.

---

## 11. Reward system trust boundaries — 🟡

**Current state.** XP, streaks, badges, spaced-repetition review queue, and challenge
completions are computed against a local reward-event ledger (`src/engine/rewards/*`)
and a `localStorage` mirror. Lesson/quiz/challenge XP is ledgered once; consecutive XP
awards serialize so an older in-flight save can't overwrite a newer total. Badge
eligibility is a pure module (`src/services/badgeRules.js`) aligned with the reward
catalog. A failed-event queue + reconciliation foundation exists for same-device
recovery. `docs/trust-boundaries.md` explicitly labels XP/streaks/badges/review/
challenges as "local-only today" and "motivational, not credentialed."

**Working.** Trust boundary is documented honestly and enforced in code (dedup,
serialized saves, idempotent ledger). The Progress Summary PDF explicitly disclaims
being a verified credential.

**Broken/risky.** The topbar level/streak and the Progress Summary PDF still *present*
these signals prominently, which can read as more authoritative than "single-device
localStorage." Reward diagnostics are developer-facing only — fine, but don't let them
look like observability.

**Overstated.** None in the docs — but the *visual* prominence of XP/level slightly
outpaces the "this is local-only" caveat. Consider a small "saved on this device"
affordance near the level pill (a tooltip is enough).

**Remove/pause/simplify.** Keep backend reward sync **off** (`VITE_REWARD_BACKEND_SYNC_ENABLED=false`)
until staging validation runs — correct as-is. Don't add more reward surfaces.

**Highest-priority fix.** Add a lightweight, dismissible "device-only progress"
indicator (tooltip/info icon) on the XP/streak display so the UI matches the docs
without a redesign.

**Acceptance criteria.** Every surface that shows XP/streak/badges has a discoverable
"saved on this device" explanation; no export claims server authority; the feature
flag stays false outside staging; `audit:reward-catalog` passes.

**Inspect.** `src/engine/rewards/`, `src/services/badgeRules.js`,
`src/services/rewardEventService.js`, `src/services/srAlgorithm.js`,
`docs/trust-boundaries.md`, the topbar/profile-popover components.

**Commands.** `npm run audit:reward-catalog`, `npm run test:unit`,
`npm run audit:staging-runbook`.

**Recruiter impact.** Medium-high — honest trust boundaries are a selling point;
making the UI echo them closes the loop.

**User impact.** Medium.

---

## 12. Authentication and Supabase readiness — 🟡

**Current state.** Supabase Auth (email/password + optional Google/GitHub).
`supabase-schema.sql` plus 9 additive migrations under `supabase/migrations/`
(reward events table, `award_reward_event` RPC, idempotency guard, profile-update
hardening, public-profile privacy, stable last-position columns, reward trust
boundaries, admin-rollup lock). `npm run check:supabase-readiness` is a static gate
that the migration/privacy artifacts exist in source. Authenticated app shell blocks
when profile verification fails (no silent "assume safe"). Authenticated E2E self-
skips without credentials; CI runs it only when the full secret set is configured.

**Working.** RLS-as-authorization is the right model; migrations are additive and
ordered; the static readiness gate prevents the docs/migrations from drifting;
fail-closed on unverified profile.

**Broken/risky.** The static gate verifies migrations are *present*, not *applied* —
`docs/handoff-deferred-risks.md` and `docs/staging-supabase-validation.md` are honest
about this, but a reviewer must read those to know. No live staging project has run
the validation runbook (by design). Auth E2E coverage exists but is dormant until
someone wires Supabase test secrets.

**Overstated.** "Supabase ready" must always be qualified as "schema + migrations in
source, not validated against a live project." The README does this; keep it.

**Remove/pause/simplify.** Nothing. The feature-flag-off + documented-runbook posture
is correct for a portfolio piece.

**Highest-priority fix.** If you can spin up a free Supabase project: apply the
migrations, run `docs/staging-supabase-validation.md` end to end, and record the
results — that single pass converts the biggest "scaffolded but unverified" caveat
into "verified in staging" and is the largest portfolio upgrade available. If not,
leave it documented and don't flip the flag.

**Acceptance criteria.** `npm run check:supabase-readiness` passes; either the staging
runbook is recorded as run, or the README/handoff doc clearly state it hasn't been
and the flag is off.

**Inspect.** `supabase-schema.sql`, `supabase/migrations/*`,
`scripts/check-supabase-readiness.mjs`, `docs/supabase-production-readiness.md`,
`docs/staging-supabase-validation.md`, `src/providers/AuthProvider`,
`src/components/auth/AuthPage.jsx`.

**Commands.** `npm run check:supabase-readiness`, `npm run audit:staging-runbook`,
`npm run test:policy` (`src/integration/supabase-policy.test.js`),
`npm run audit:auth-e2e`.

**Recruiter impact.** Medium-high — "I scaffolded it safely and documented exactly
what verification remains" is a strong story; "I validated it in staging" is stronger.

**User impact.** Low today (flag off).

---

## 13. Accessibility — 🟡

**Current state.** Dedicated a11y tests (`AuthPage.a11y.test.jsx`,
`Sidebar.a11y.test.jsx`, `ProfilePage.a11y.test.jsx`, `lessonTasks.a11y.test.js`),
heading-order tests for both lesson renderers, Playwright a11y smoke
(`accessibility.smoke.spec.js`, `authenticated.accessibility.spec.js`) using
`@axe-core/playwright`. Recent work: sidebar mobile drawer made `inert`/out of tab
order when closed; `prefers-reduced-motion` disables the loading animation; dialog
`aria-labelledby`/`aria-describedby`; native radio semantics for single-answer quizzes;
`prefers-reduced-data` gates Monaco. `docs/accessibility-color-contrast-todo.md`
exists, implying contrast work is not finished.

**Working.** Real axe-core coverage in both unit and E2E; focus/keyboard hardening on
overlays; reduced-motion and reduced-data respected; an honest open-items doc.

**Broken/risky.** `docs/accessibility-color-contrast-todo.md` is an open TODO — colour
contrast is not verified across the palette. Lighthouse/a11y E2E run in GitHub Actions
only, not in `npm run check:quality`, so a local-only contributor won't catch
regressions. axe-core catches a subset of WCAG; no manual screen-reader pass is
documented.

**Overstated.** "Accessibility hardening" is real but partial — keep calling it
"iterative accessibility hardening," not "WCAG AA compliant."

**Remove/pause/simplify.** Nothing to remove. Close the colour-contrast TODO or
explicitly scope it as future work in `KNOWN_LIMITATIONS.md`.

**Highest-priority fix.** Resolve `docs/accessibility-color-contrast-todo.md`: run a
contrast check across the token palette, fix failures, and either delete the doc or
move remaining items into `KNOWN_LIMITATIONS.md`.

**Acceptance criteria.** `npm run test:a11y` green; Lighthouse a11y score recorded;
no open contrast TODO doc that isn't reflected in `KNOWN_LIMITATIONS.md`.

**Inspect.** `*.a11y.test.*` files, `tests/e2e/accessibility.smoke.spec.js`,
`tests/e2e/authenticated.accessibility.spec.js`, `lighthouserc.json`,
`docs/accessibility-color-contrast-todo.md`, `src/styles/`.

**Commands.** `npm run test:a11y`, `npm run test:a11y:unit`, `npm run test:lighthouse`.

**Recruiter impact.** Medium-high — axe in CI is a strong signal; an unresolved
contrast TODO undercuts it slightly.

**User impact.** Medium-high.

---

## 14. Mobile UX — 🟡

**Current state.** Mobile learning flow with sticky lesson navigation, topbar search,
and a compact "tools sheet" rendered from a shared tool registry (compact icons,
constrained labels, safe disabled states). `useIsMobile` gates Monaco off on phones.
Playwright `mobile-learning-smoke.spec.js`, mobile-chrome project in public smoke,
mobile visual snapshots (360×780, 390×844). `interactive-widget=resizes-content` in
the viewport meta.

**Working.** Genuine mobile-specific affordances, not just a responsive shrink; mobile
E2E + visual snapshots in CI; Monaco off on phones is the right call.

**Broken/risky.** Mobile visual snapshots are Windows-generated (`-win32` suffix) —
they'll false-fail on a Linux CI runner unless regenerated there or the CI matrix
matches. The mobile tools sheet is a recent addition; confirm it's keyboard- and
screen-reader-navigable (not just touch).

**Overstated.** Nothing major.

**Remove/pause/simplify.** Regenerate visual snapshots on the CI platform (or pin the
Playwright runner OS) so the visual suite is meaningful.

**Highest-priority fix.** Fix the snapshot-platform mismatch (`-win32` baselines on a
Linux CI) so `public.visual.spec.js` / `authenticated.visual.spec.js` aren't
silently broken or perpetually skipped.

**Acceptance criteria.** Visual specs pass on CI's actual OS; mobile tools sheet
passes the existing a11y assertions; mobile smoke green.

**Inspect.** `tests/e2e/mobile-learning-smoke.spec.js`,
`tests/e2e/public.visual.spec.js` + `-snapshots/`, `playwright.config.js`,
the mobile tools-sheet component under `src/components/layout` / `src/components/shared`,
`src/hooks/useIsMobile.js`.

**Commands.** `npm run test:e2e:smoke:mobile`, `npm run test:e2e`,
`npm run test:e2e:update-snapshots` (on the CI OS).

**Recruiter impact.** Medium — mobile-specific UX + visual regression tests read well.

**User impact.** High for mobile learners.

---

## 15. Performance and bundle health — 🟡

**Current state.** Vite 8 build. Monaco editor is lazy-loaded and split into multiple
chunks via manual chunking in `vite.config.js` so it never enters the initial bundle;
also gated by `useIsMobile` and `usePrefersReducedData`. `npm run check:bundle`
(`scripts/check-bundle-size.mjs` + `scripts/bundleBudgetPolicy.mjs`) enforces a bundle
budget in `check:quality`. Lighthouse CI runs in GitHub Actions
(`.github/workflows/lighthouse-ci.yml`, `lighthouserc.json`). Search manifest is
lazy-loaded (generated, with a `check:search-manifest` guard). Fonts are self-hosted
via `@fontsource*`. Critical CSS is inlined in `index.html` to avoid FOUC.

**Working.** Real bundle budget gate in CI; Monaco isolation is the textbook move and
it's done; Lighthouse CI exists; lazy search manifest.

**Broken/risky.** Lighthouse runs only in Actions, not locally — no recorded scores in
the repo, so the case-study line "add Lighthouse CI scoring" is still a TODO. `jspdf`
and `@sentry/react` are non-trivial deps in the dependency list — confirm `jspdf` is
code-split into the PDF flow only and Sentry is tree-shaken / lazy in production.

**Overstated.** "Performance hardening" is mostly the Monaco split + a budget gate —
fair, but pair it with actual Lighthouse numbers to substantiate it.

**Remove/pause/simplify.** Nothing to remove. Verify `jspdf` is dynamically imported
where the Progress Summary PDF is built, not in the main chunk.

**Highest-priority fix.** Capture and commit Lighthouse scores (e.g. into
`docs/` or the case study) from a CI run so "Lighthouse CI" is a result, not an
aspiration; confirm `jspdf` is lazy.

**Acceptance criteria.** `npm run build` passes `check:bundle`; Lighthouse run output
recorded; `jspdf`/Monaco/search-manifest confirmed absent from the initial chunk.

**Inspect.** `vite.config.js`, `scripts/check-bundle-size.mjs`,
`scripts/bundleBudgetPolicy.mjs`, `lighthouserc.json`,
`.github/workflows/lighthouse-ci.yml`, wherever the PDF is generated (search `jspdf`),
`src/hooks/usePrefersReducedData.js`.

**Commands.** `npm run build`, `npm run check:bundle`, `npm run test:lighthouse`.

**Recruiter impact.** Medium-high — "I budget the bundle in CI and keep Monaco out of
the entry chunk" is a strong, specific claim; back it with numbers.

**User impact.** Medium.

---

## 16. Security and privacy boundaries — 🟡

**Current state.** `SECURITY.md` exists. CSP `script-src 'self'` (SW registration
moved into `src/lib/registerSW.js` to comply). `.github/workflows/security-audit.yml`
runs dependency/secret-risk checks; `dependabot.yml` configured. Netlify security
headers in `netlify.toml`. RLS is the authorization boundary. Secrets are server-only
(`OPENAI_API_KEY`, `SUPABASE_SERVICE_KEY`, `STREAK_REMINDER_SECRET`) and never
`VITE_`-prefixed; `.env.example` documents this loudly. The streak-reminder function
requires a shared secret for manual POST. Sync telemetry is privacy-scrubbed (no
learner IDs, lesson keys, note content, or raw DB messages). `dompurify` pinned via
`overrides`. Public profile SQL exposes aggregate fields only.

**Working.** Genuinely solid for a portfolio piece: server-only secrets, RLS, CSP,
dependency/secret CI, privacy-scrubbed analytics, hardened Netlify functions.

**Broken/risky.** `KNOWN_LIMITATIONS.md` says "production-grade AI/security hardening
is outside this batch and remains planned" — so don't claim more than "baseline
hardening." No documented threat model / pen-test. Service-role key usage in
`streak-reminder.js` is a sharp edge (correctly flagged in `.env.example`); make sure
it's never logged.

**Overstated.** "Security posture" — keep it framed as "baseline hardening + honest
limits," which `KNOWN_LIMITATIONS.md` does.

**Remove/pause/simplify.** Nothing to remove.

**Highest-priority fix.** Run `npm audit` / the security-audit workflow and ensure it's
clean (or document accepted advisories); confirm no secret is logged in any Netlify
function on error paths.

**Acceptance criteria.** `security-audit.yml` green; no `VITE_`-prefixed secret;
`SECURITY.md` reflects the actual contact/disclosure process; CSP present in deployed
headers.

**Inspect.** `SECURITY.md`, `netlify.toml`, `netlify/functions/_shared.js`,
`netlify/functions/streak-reminder.js`, `.github/workflows/security-audit.yml`,
`.env.example`, `package.json` `overrides`.

**Commands.** `npm audit`, `npm run check:quality` (runs lint + build + audits).

**Recruiter impact.** High — this is one of the strongest areas; just don't oversell it.

**User impact.** High (data isolation).

---

## 17. AI tutor safety and usefulness — 🟡

**Current state.** All AI calls go through `netlify/functions/ai.js`: requires a valid
Supabase JWT (`verifyActiveUser`), blocks unverified email accounts, enforces a
Postgres-backed per-user quota (`consume_ai_quota` SECURITY DEFINER RPC) plus an
in-memory hot-instance limiter (10/min), strict payload caps (system ≤2000 chars,
≤20 messages, ≤4000 chars/msg, ≤12000 total, ≤1024 output tokens), a mandatory
server-side `GUARDRAIL_PREFIX` prepended to any client `system` (refuses off-topic /
persona-switch / "ignore instructions" requests), and a role whitelist. Frontend wrapper
`src/services/aiService.js` surfaces a stable `AIServiceError.code` from
`AI_ERROR_CODES` so callers switch on codes, not message regex. Fails closed (503) if
the quota RPC is unreachable rather than burning OpenAI credits. Model
`gpt-4o-mini` by default.

**Working.** This is a textbook server-mediated LLM proxy: auth-gated, rate-limited at
two layers, payload-capped, prompt-injection-resistant via a leading guardrail,
fail-closed, no key in the browser. The stable-error-code design is a nice touch.

**Broken/risky.** No content filtering on *responses* (relies on OpenAI's own
moderation + the system prompt). The guardrail is a single prepended block — strong but
not infallible against determined jailbreaks; acceptable for this scope. `gpt-4o-mini`
is fine; just note `OPENAI_MODEL` is env-configurable so a misconfig could swap models.
Usefulness depends on the lesson context passed in `clientSystem` (≤2000 chars) — worth
confirming the tutor actually receives the current lesson's content, not just a generic
prompt.

**Overstated.** "AI tutor" — it's a context-aware Q&A helper, which is appropriate;
don't imply it grades work or tracks mastery.

**Remove/pause/simplify.** Nothing. The design is right-sized.

**Highest-priority fix.** Verify the client passes meaningful lesson context into
`system` (so the tutor answers in-context), and that `aiService.js` handles the
`EMAIL_NOT_VERIFIED` (403) and `429`/`503` codes with clear user-facing copy.

**Acceptance criteria.** AI endpoint rejects: no token, expired token, unverified
email, oversized payload, >10/min; guardrail prefix present in every request; the
tutor receives current-lesson context; error codes map to friendly UI messages.

**Inspect.** `netlify/functions/ai.js`, `netlify/functions/_shared.js`,
`src/services/aiService.js`, the AI panel components (`src/components/learning/challenge/`
AI panel, lesson AI tutor), `supabase-schema.sql` (`consume_ai_quota`).

**Commands.** No npm test covers the live function; `npm run test:unit` covers
`aiService.js` error mapping. Manual: hit the function without a token → expect 401.

**Recruiter impact.** High — a properly secured LLM proxy is a standout portfolio
artifact; lead with it in the demo.

**User impact.** Medium.

---

## 18. Admin / content-authoring flow — ⚪

**Current state.** `LessonBuilder` admin tool split into `useLessonBuilder.js` (state),
a pure codegen util, three view-tab components, and shared `LBField`/`ArrayField`
primitives. Reached via an `AdminRoute` guard (`AdminRoute.test.jsx` exists). Content
itself is source-file based (`src/data/**`), not a CMS — the builder emits code you
paste in. Recent commits hardened admin access checks and admin-user rollups (SQL
migration `202605110002_lock_admin_user_rollups.sql`).

**Working.** The builder is cleanly decomposed and testable; admin route is guarded
and tested; admin rollups are locked down at the DB level.

**Broken/risky.** It's a code-generator, not a publishing pipeline — fine for a
portfolio, but a reviewer who expects a CMS will be surprised; the README is honest
("source-file based, no full CMS workflow"). The dual lesson format (area 6) means the
builder presumably emits one format — confirm it emits the *structured* format so it
doesn't generate legacy-shape lessons.

**Overstated.** Don't call it a "content management system" — it's an authoring
*helper*.

**Remove/pause/simplify.** Consider gating the admin route behind a build flag in the
public demo so reviewers don't stumble into a half-feature, or clearly label it
"authoring tool (dev)".

**Highest-priority fix.** Confirm `LessonBuilder` codegen emits the structured lesson
shape (and add the area-6 format audit so it can't emit legacy).

**Acceptance criteria.** Admin route is inaccessible to non-admins (tested);
`LessonBuilder` output passes `audit:content` and the proposed `audit-lesson-format`
gate; README accurately calls it an authoring helper.

**Inspect.** `src/components/admin/LessonBuilder.jsx`,
`src/components/admin/lesson-builder/`, `src/hooks/useLessonBuilder.js`,
`src/routes/guards/AdminRoute.jsx`, `supabase/migrations/202605110002_lock_admin_user_rollups.sql`.

**Commands.** `npm run test:unit`, `npm run audit:content`.

**Recruiter impact.** Low-medium — a bonus if it works cleanly, a liability if it's a
visible stub.

**User impact.** None (admin-only).

---

## 19. Testing and CI coverage — 🟡

**Current state.** ~155 unit/component test files (README claims "430+ tests" — verify
the count after PR #90's update). Vitest unit/component suite includes axe-core a11y
tests. Playwright: public smoke (landing, auth, accessibility, visual snapshots, first-
lesson preview) runs by default; authenticated lesson/mobile/visual paths self-skip
without Supabase creds; CI runs them only when the full secret set is present. A large
set of repo-integrity audits (`audit:quizzes --strict`, `audit:content`,
`audit:reward-catalog`, `audit:e2e-scripts`, `audit:auth-e2e`, `audit:staging-runbook`,
`audit:lesson-labels`, `check:supabase-readiness`, `check:bundle`,
`check:search-manifest`, `check:js-source`) are wired into `npm run check:quality`.
Workflows: `ci-smoke.yml`, `e2e-smoke.yml`, `lighthouse-ci.yml`, `security-audit.yml`,
`js-source-policy.yml`, `ops-checks.yml`. `npm run typecheck` is intentionally a JS-only
source-policy alias (no TS compiler — TS isn't in the stack).

**Working.** Unusually disciplined for a portfolio piece: strict quiz gate in CI,
content/reward/label audits, bundle budget, Supabase readiness, axe in unit + E2E,
authenticated-E2E readiness audit. The "typecheck = JS-source-policy" decision is
documented and consistent.

**Broken/risky.** Authenticated E2E never actually runs (no configured Supabase
secrets) — so the most important learner flows have CI *infrastructure* but not CI
*coverage*. Visual snapshots are `-win32` baselines (area 14) — they'll break on a
Linux runner. `npm run typecheck` being a no-op alias is honest but a reviewer who
runs it expecting type checking may be briefly confused (the README explains it). The
"430+ tests" number needs to be re-verified and kept current.

**Overstated.** "430+ tests including accessibility integration tests" — true, but the
*authenticated* journey is unit-tested + E2E-scaffolded, not E2E-exercised in CI; say
so.

**Remove/pause/simplify.** Don't add more audit scripts — the gate is already dense;
make sure each one is fast. Consider consolidating the many `audit:*` scripts under one
`npm run audit` umbrella for reviewer legibility.

**Highest-priority fix.** Either (a) configure a Supabase test project + secrets so
authenticated E2E actually runs in CI, or (b) state plainly in README/CI that
authenticated E2E is scaffolded-but-dormant and the dormant path is intentional — and
fix the `-win32` visual snapshot platform mismatch either way.

**Acceptance criteria.** `npm run check` and `npm run check:ci` pass on a fresh clone;
the README test count matches `vitest run` output; visual specs pass on CI's OS;
authenticated E2E either runs or is documented as dormant-by-design.

**Inspect.** `package.json` scripts, `.github/workflows/*`, `vitest.config.js`,
`playwright.config.js`, `scripts/typecheck.mjs`, `scripts/audit-*.mjs`,
`tests/e2e/*`.

**Commands.** `npm run check`, `npm run check:ci`, `npm run test:unit`,
`npm run test:e2e`, `npm run audit:auth-e2e`.

**Recruiter impact.** High — the breadth of CI gates is a real differentiator; the
dormant authenticated E2E is the one caveat to state up front.

**User impact.** Indirect.

---

## 20. Portfolio / recruiter presentation — 🔴

**Current state.** Rich reviewer scaffolding: `REVIEWER_START_HERE.md`,
`docs/reviewer-start-here.md`, `docs/reviewer-demo-script.md`,
`docs/reviewer-evidence-map.md`, `docs/portfolio-case-study.md`,
`docs/branch-triage.md`, `RELEASE_CHECKLIST.md`, `CHANGELOG.md`, plus ~40 files in
`docs/`. README has a dedicated "Recruiter / Hiring Context" section and a long list of
"files most worth a look." `docs/screenshots/` exists but the case study's "what I
would do next" still lists "add final screenshot assets" — implying it's empty/thin.

**Working.** The claim-to-code evidence map and demo script are genuinely useful and
unusual; the case study has real before/after tradeoff analysis; the README's
"files worth a look" list is a great reviewer on-ramp.

**Broken/risky.** (1) **Doc sprawl** — ~40 docs, several overlapping (`reviewer-start-
here.md` vs `REVIEWER_START_HERE.md`, three progress-context decomposition plans, many
reward-*.md files) reads as process exhaust, not a curated case study. (2) **Stale
docs** — `branch-triage.md` references dead PRs (area 2); `portfolio-case-study.md`
says "add screenshots" and "add Lighthouse scoring" as future work that should now be
done. (3) **No screenshots** — a portfolio learning platform with an empty
`docs/screenshots/` is a missed layup; recruiters skim visuals first. (4) The
case study's resume blurb calls it "a multi-track **SaaS-style** coding education
platform" which flirts with the "production SaaS" overclaim the posture explicitly
disowns.

**Overstated.** "SaaS-style platform" in the resume blurb; "coding bootcamp" in
`index.html` (area 3).

**Remove/pause/simplify.** Prune `docs/` to a curated set: keep README,
`KNOWN_LIMITATIONS.md`, `reviewer-start-here.md`, `portfolio-case-study.md`,
`reviewer-evidence-map.md`, `reviewer-demo-script.md`, `architecture.md`,
`trust-boundaries.md`, `repair-roadmap.md`, `handoff-deferred-risks.md`; move the
dozen+ planning/decomposition/reward-strategy docs into a `docs/internal/` (or `docs/notes/`)
subfolder so the reviewer-facing set is small and current. Delete the duplicate
`REVIEWER_START_HERE.md` if `docs/reviewer-start-here.md` is canonical.

**Highest-priority fix.** Add 4–8 real screenshots (landing, guest preview, a
structured lesson, quiz, challenge with the honesty note, dashboard, mobile tools
sheet) to `docs/screenshots/` and reference them in the case study + README; then prune
stale docs (branch-triage, "add screenshots" TODO) so nothing in the reviewer path is
out of date.

**Acceptance criteria.** Every reviewer-facing doc is current (no dead PR refs, no
"add screenshots" TODO once added); `docs/screenshots/` has real images used in the
case study; the resume blurb says "self-paced learning platform," not "SaaS"; a
recruiter can go README → reviewer-start-here → demo-script → screenshots without
hitting a stale or empty file.

**Inspect.** `README.md`, `REVIEWER_START_HERE.md`, `docs/reviewer-start-here.md`,
`docs/reviewer-demo-script.md`, `docs/reviewer-evidence-map.md`,
`docs/portfolio-case-study.md`, `docs/branch-triage.md`, `docs/screenshots/`,
all of `docs/`.

**Commands.** `npm run dev` (capture screenshots); `npm run test:e2e` (Playwright can
also produce screenshots via the visual specs); `git ls-files docs | wc -l`.

**Recruiter impact.** Very high — this is the area that most directly determines the
portfolio outcome. The engineering is already strong; the presentation needs
de-cluttering and visuals.

**User impact.** None directly.

---

## Top 10 fixes, ordered

1. 🔴 **Branch/PR cleanup** — delete `copilot/*` and merged `codex/*` remote branches;
   refresh or remove `docs/branch-triage.md` (it references dead PRs #41/#42/#43). (Areas 2)
2. 🔴 **Align public copy with posture** — drop "coding bootcamp" / soften "auto-graded"
   in `index.html` meta/OG/JSON-LD; change the case-study resume blurb away from "SaaS".
   Verify PR #90 lands this. (Areas 3, 20)
3. 🔴 **Add screenshots + prune docs** — populate `docs/screenshots/`, wire them into
   the case study/README, move ~12 internal planning docs into `docs/internal/`, delete
   duplicate `REVIEWER_START_HERE.md`. (Area 20)
4. 🟡 **Lock the lesson format** — add `scripts/audit-lesson-format.mjs` to
   `check:quality`; migrate one React module to the structured shape; move dead HTML
   `modules/*.js` files out of the active folder. (Areas 6, 7, 18)
5. 🟡 **Make the reward trust boundary visible in the UI** — add a "saved on this
   device" tooltip near the XP/streak display. (Area 11)
6. 🟡 **Fix visual-snapshot platform mismatch** — regenerate `-win32` baselines on the
   CI OS (or pin the Playwright runner OS). (Areas 14, 19)
7. 🟡 **Decide authenticated-E2E status** — either configure Supabase test secrets so it
   runs in CI, or state in README/CI that it's dormant-by-design. (Area 19)
8. 🟡 **Land the stable-ID resume migration** — finish the C2 migration so
   `audit:lesson-labels` stops being a rename freeze. (Area 10)
9. 🟡 **Close the colour-contrast TODO** — run a palette contrast pass; fix or move
   remaining items into `KNOWN_LIMITATIONS.md`. (Area 13)
10. 🟡 **Verify + record Lighthouse + `jspdf` lazy-load** — capture Lighthouse scores
    from a CI run; confirm `jspdf` is dynamically imported only in the PDF flow. (Area 15)

## Things to explicitly keep saying (honesty wins)

- XP, streaks, badges, the spaced-repetition review queue, and challenge completions
  are **saved on this device only**; lesson completions, bookmarks, and notes sync when
  connected.
- Progress Summary PDFs are **learner progress summaries, not verified certificates**.
- Challenge auto-grading is a **practice aid** — HTML uses DOM checks, CSS mixes
  computed-style + source regex, JS/React use console output.
- Backend reward sync is **scaffolded but disabled** until Supabase migrations are
  applied and authenticated duplicate-award flows are verified against a real project.
- Supabase is **schema + migrations in source**, not validated against a live project.
- `npm run typecheck` is a **JS-only source-policy alias**; this project intentionally
  doesn't run the TypeScript compiler.
- The React track is on the **legacy lesson format**; HTML/CSS/JS are on the structured
  format.

## What NOT to do

- No full rewrite, no new state/design framework, no CMS, no credentialing system.
- Don't flip `VITE_REWARD_BACKEND_SYNC_ENABLED` to `true` outside a validated staging
  environment.
- Don't mechanically convert React lessons to the structured format (it would degrade
  content quality) — gate the direction and migrate by hand at curriculum pace.
- Don't add more `audit:*` scripts; the quality gate is already dense.
