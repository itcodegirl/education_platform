# Branch And PR Triage

Last reviewed: May 12, 2026.

This note is a point-in-time map of open PRs and branch state, not a product
roadmap. Goal: keep the review path clean before adding or changing features.

## Remote State Snapshot

- Live branches on `origin`: `main` only (plus short-lived automation branches
  such as `claude/*` while a session is in flight).
- All previously parked `codex/*` / `feat/*` reward and backend branches listed
  in earlier revisions of this file have been merged or deleted. Do not expect
  them to exist; do not resurrect them by name.
- Open PRs: **1** — PR #90.

## Open PR Triage

### PR #90 — `codex/security-trust-hardening` → `main`

"Fix CI dependencies and improve learner trust and navigation." 24 files,
+357/−121, 8 commits, merge conflicts already resolved against `origin/main`
(merge `ace45e7`, post-merge fixes `ad9d8b2`). Netlify deploy preview green;
no required CI gate is red (`Pages changed` is `neutral`, which is normal).
`mergeable_state: unstable` here only reflects the neutral Netlify check, not a
failure.

What it actually does that matters for chaos-reduction:

- Makes lesson completion idempotent inside a single render tick by switching
  `toggleLesson` from the derived `completedSet` to a synchronous `completedRef`
  and adding explicit `{ completed: true|false }` semantics. On `main` today two
  rapid `completeLesson` calls can toggle a lesson back **off** (stale
  `completedSet`); XP is still protected by the reward-history ref, but the
  completion bit flips. This PR closes that.
- Makes `recordDailyActivity()` fire only when XP was actually awarded
  (`useQuizSession`, `learningEngine.submitQuiz/completeChallenge`). On `main`,
  a no-op retry/replay still bumps the streak/daily counters — a small honesty
  bug. This PR fixes it.
- Wires `legacyQuizKeys` through `QuizView` so a quiz taken under an old key and
  a stable key cannot double-award (the dedup helper already exists in
  `useQuizSession`; the prop plumbing was missing).
- `getBestQuizScoreForKeys` / `compareQuizScoreValues` in `rewardPolicy.js` so
  best-score selection is consistent across key aliases.
- Accessibility: closed mobile sidebar is `inert` + out of tab order;
  `prefers-reduced-motion` disables the boot animation; `useInView` short-circuits
  under reduced motion.
- Copy: ErrorBoundary / ConnectionError / `index.html` meta moved off
  "bootcamp / build real projects" language toward "learning platform / honest
  progress tracking" and "your local progress is still kept" framing.
- Removes a duplicated function block in `src/data/reference/search-index.js`.

Outstanding review note on the PR (not yet addressed):

- `chatgpt-codex-connector` P2: the authenticated `synced` copy in
  `src/utils/syncStatusCopy.js` / `src/constants/progressCopy.js` says XP,
  streaks, badges, and review cards "stay on this device today" while the
  provider does call `updateXP`, `updateStreak`, `awardBadge`, `addSRCard`. The
  data is written to the cloud; what is *not* guaranteed is duplicate-safe
  cross-device reconciliation. The copy should say "written to your account but
  not yet duplicate-safe across devices" rather than "single-device" or
  "device-only". Track this as a follow-up; it is not a blocker for #90 itself.

## Disposition

1. **Merge:** PR #90, after the validation commands below pass and the
   `syncStatusCopy` wording note above is either fixed in the PR or filed as a
   tracked follow-up. It is net-positive for trust correctness and has no
   conflicting work in flight.
2. **Close:** none.
3. **Rebase:** none required — #90 is already merged up to current `main`.
4. **Cherry-pick:** none — no parked branches remain to harvest.
5. **Pause:** none. (Backend reward sync is *code-paused via the
   `VITE_REWARD_BACKEND_SYNC_ENABLED=false` flag*, not via a parked branch — see
   "Backend reward sync" below. Do not flip that flag as part of feature work.)

## Final Merge Order

1. PR #90 (`codex/security-trust-hardening`).

That's the whole queue. Once it lands, `main` is the single source of truth and
new feature work starts from a clean base.

## Validation Before Each Merge

Before merging PR #90 (run from the PR head):

```
npm ci
npm run check:ci
```

`check:ci` expands to `lint` → `check:js-source` → `check:search-manifest` →
`audit:e2e-scripts` → `audit:auth-e2e` → `check:supabase-readiness` →
`audit:reward-catalog` → `audit:staging-runbook` → `build` → `check:bundle` →
`audit:lesson-labels` → `audit:quizzes` → `audit:content` → `test:unit` →
`test:integration` (Playwright).

If you only need the fast inner loop while reviewing: `npm run check`
(quality + unit). Reward-specific spot checks:

```
npx vitest run src/engine/rewards src/services/rewardPolicy.test.js \
  src/services/rewardEventService.test.js src/services/rewardSyncService.test.js \
  src/services/learningEngine.test.js src/hooks/useLearnerRewards.test.jsx \
  src/hooks/useDailyActivity.test.jsx src/components/learning/QuizView.test.jsx \
  src/context/ProgressContext.test.jsx
node scripts/check-reward-catalog.mjs
```

## Backend Reward Sync — Standing Rule

- `VITE_REWARD_BACKEND_SYNC_ENABLED` stays `false` in `.env.example`,
  `netlify.toml`, and all non-staging environments. The Supabase migrations
  (`reward_events`, `award_reward_event`, `reward_catalog`, idempotency +
  trust-boundary hardening) are additive and present, but cross-device reward
  idempotency is not production-verified.
- Do not enable the flag, apply the migrations to production, or remove the
  local fallback path as part of an unrelated feature PR. That work gets its own
  scoped PR plus the `docs/staging-supabase-validation.md` runbook pass.

## Future Branch Rule

- Start new work from `origin/main`.
- One trust boundary per PR: docs/readiness, UX/a11y, product logic, backend
  sync, or launch hardening — never mixed.
- Never push local `main`; open a `codex/*`-style branch from `origin/main`.
- Run `npm run check` before opening any PR; `npm run check:ci` before merge.
