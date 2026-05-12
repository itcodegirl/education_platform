# Handoff: Intentionally Deferred Risks

This document is the engineering handoff for two known platform risks that the audit roadmap intentionally deferred. Both are documented elsewhere as "future work" or "limitations"; this file is the single place that explains, for each one, **what is stable today, what is blocking the next step, and what a contributor needs from outside the repo to land it.**

It is not a TODO list. The current behavior is intentional. Read this before assuming either area is unfinished.

## Purpose / Context

Two systems reached a stable, shippable state and were then explicitly stopped at the same milestone:

- **Risk A — React lesson format unification.** Two lesson-rendering paths coexist (`StructuredLessonBody` for `hook/do/understand/build/challenge/summary/bridge` and `RichLessonBody` for the legacy `concepts/tasks/devFession` shape). The HTML, CSS, and JS courses are partially or fully on the structured format; the React course is entirely on the legacy format.
- **Risk B — Backend reward sync flip.** The Supabase migrations, RPC, and feature-gated frontend wrapper exist and are unit-tested. The flag (`VITE_REWARD_BACKEND_SYNC_ENABLED`) is `false` in `.env.example` and intended to remain `false` in production until staging validation has actually been run against a real Supabase project.

Both are listed in [`KNOWN_LIMITATIONS.md`](../KNOWN_LIMITATIONS.md). This document goes deeper.

## Why These Risks Were Deferred

Each risk is deferred for a reason that source-only work cannot resolve.

- Risk A requires **curriculum redesign**, not a refactor. Mechanical migration would degrade content quality.
- Risk B requires **live Supabase staging access**, not local code changes. The flag itself is the rollback contract; flipping it without an authenticated cross-device validation pass would erode reward trust rather than improve it.

## Current Stable State

The platform behaves correctly today. Every flow listed below is tested and shipped:

- All four courses (HTML, CSS, JS, React) render, navigate, and grade through `LessonView`.
- Lessons in either format share the same surrounding shell: bookmark, notes, AI tutor, lesson quiz, prev/next pagination.
- XP, streaks, badges, the SR review queue, and challenge completions are durable per-device through the local reward ledger and queue (`src/engine/rewards/*`).
- Reward dedup is enforced same-device by `useLearnerRewards` (reward-history Set) and by the local reward-event ledger.
- The retry queue replays failed cloud writes on `online` events and on session resume (`src/hooks/useProgressSync.js`).

Nothing in this document indicates the platform is broken. Both risks are about closing the gap between "stable demo" and "production-grade product."

---

## Risk A — React Lesson Format Unification

### Current safe state

`src/components/learning/LessonView.jsx:54` branches on the lesson shape:

```jsx
const isStructured = !!(lesson.hook || lesson.do || lesson.understand);
```

When the lesson exposes `hook`, `do`, or `understand` keys, `StructuredLessonBody` renders. Otherwise `RichLessonBody` renders. Both bodies are tested for heading-order and accessibility (`StructuredLessonBody.headings.test.jsx`, `RichLessonBody.headings.test.jsx`).

The breakdown today:

| Course | Module source files | Format |
| --- | --- | --- |
| HTML | `src/data/html/modules/*.json` (4) + `src/data/html/modules/*.js` (legacy)| Mixed — manifest mounts the JSON modules |
| CSS | `src/data/css/modules/*.json` (4) | Structured |
| JS | `src/data/js/modules/*.json` (6) | Structured |
| React | `src/data/react/modules/*.js` (legacy) | Legacy |

The React course manifest (`src/data/react/course.js`) imports ten legacy `module*` exports. The shape of each lesson follows the older contract: `concepts: string[]`, `code: string`, `output: string`, `tasks: string[]`, `challenge: string`, `devFession: string`.

The structured shape is richer: each `concept` is `{ name, definition, analogy }`, the `do` step is itemised with proof requirements, and `bridge` previews the next lesson. The information density is intentionally higher.

### Unused React module source files

`src/data/react/modules/` contains 24 `module*.js` files but `src/data/react/course.js` imports only 10 of them. The other 14 (`accessibility-in-react.js`, `advanced-patterns.js`, `backend-integration-auth.js`, `build-a-real-project.js`, `components.js`, `conditional-rendering-lists.js`, `context-global-state.js`, `data-fetching-async-patterns.js`, `error-boundaries.js`, `events-in-react.js`, `props.js`, `state-usestate.js`, `styling-in-react.js`, `useref-custom-hooks.js`) are not wired into the curriculum. Some lesson quizzes in `src/data/react/quizzes.js` reference lesson IDs that only exist in those unused files (e.g. `r17-1` from `error-boundaries.js`), which is why `audit:quizzes` classifies them as `future-advanced-content` orphans.

These files are not dead in the "delete on sight" sense — they are a curriculum reservoir. But they should be either (a) promoted into `course.js` as part of the structured-format migration below, or (b) removed together with their orphan quizzes. Until then, treat them as inert: do not import them ad hoc, and do not rely on `audit:quizzes` orphan counts staying constant if they move.

### Deferred improvement

Convert the React course from the legacy `RichLessonBody` shape to the structured `StructuredLessonBody` shape. After conversion is complete and verified, the legacy renderer (`RichLessonBody.jsx`) and its branch in `LessonView.jsx` can be removed entirely.

### Why this is not a refactor

A field-level transposition (`concepts` → `understand.concepts[].name`, `tasks` → `challenge.requirements`, etc.) loses information in every direction. The structured shape demands content that does not exist in the legacy lessons:

- Named concepts with analogies. Legacy `concepts` are bullet-form prose; the structured `understand.concepts[]` requires a `{ name, definition, analogy }` triple per idea.
- Step-by-step `do` instructions with a `result` and `proofRequired`.
- A `build` block extending the example with a `codeComparison.old` / `codeComparison.new` diff.
- A `challenge.requirements` checklist rather than a single `challenge` paragraph.
- A `summary.capabilities` list and a `bridge.preview` for the next lesson.

A script that fills these in mechanically would produce thin, repetitive content that reads worse than the legacy lessons. **The only honest migration is a curriculum-led rewrite.**

### Blocking dependency

A curriculum owner with React teaching experience needs to write the structured content for ~41 lessons across 10 modules. Engineering can scaffold and gate; engineering cannot author.

### Risk if ignored

- **Visible UX inconsistency.** A learner who finishes the JS track and starts React sees the lesson surface change. That is the single strongest "demo, not product" signal in the platform.
- **Silent regression.** Without a CI guard, a future contributor could land a new course module in the legacy format. The dual-render path keeps it working but pulls the platform back toward dual-format permanence.

### Recommended migration approach

1. **Lock the direction.** Add `scripts/audit-lesson-format.mjs` that walks every active module and fails CI when a lesson lacks all three of `hook`, `do`, `understand`. Wire it into `npm run check:quality`. New course content cannot ship in the legacy shape after that gate exists.
2. **Land a worked example.** Pick one React module (e.g. `what-react-is.js` → `what-react-is.json`). Migrate it by hand, paying full curriculum attention to `understand.concepts`, `build.codeComparison`, and `challenge.requirements`. Ship the migrated file as the reference shape.
3. **Add a scaffold script.** `scripts/migrate-legacy-lesson.mjs` reads a legacy module file and emits a starter `.json` with the obvious mappings filled in (`title`, `code`, `tasks` → `challenge.requirements`) and the gaps marked `TODO: …`. Make it explicit that the script is a starting point, not a finished migration.
4. **Migrate one module per PR.** Each PR imports the new `.json` in `src/data/react/course.js`, removes the legacy `.js` import, and runs the audit gate. The branch in `LessonView.jsx` is removed only when zero lessons fail the structured-shape audit.
5. **Delete `RichLessonBody.jsx`** when the audit reports zero legacy lessons. At that point the component, its tests, and the `isStructured` branch are dead code.

### Related artifacts

- `src/components/learning/LessonView.jsx` — branch point.
- `src/components/learning/StructuredLessonBody.jsx`, `src/components/learning/RichLessonBody.jsx` — the two renderers.
- `src/components/learning/StructuredLessonBody.headings.test.jsx`, `src/components/learning/RichLessonBody.headings.test.jsx` — heading-order guards.
- `src/data/react/modules/*.js` — legacy lessons to migrate.
- `src/data/html/modules/*.json` — reference structured shape.
- `scripts/audit-learning-content.mjs`, `scripts/check-lesson-labels.mjs` — adjacent content gates already in CI.

---

## Risk B — Backend Reward Sync Flip

### Current safe state

Reward dedup, retry, and reconciliation run entirely against the local engine in `src/engine/rewards/`:

- `rewardLedger.js` — per-learner `localStorage` ledger of processed event keys.
- `rewardQueue.js` — same-device retry queue for events that failed processing.
- `rewardReconciliation.js` — replay of queued events on session resume.
- `rewardRuntime.js` — orchestration; consults the local ledger before optionally calling the backend RPC.

The Supabase backend artifacts exist and are version-controlled:

- `supabase/migrations/202604250001_create_reward_events.sql` — `public.reward_events` table.
- `supabase/migrations/202604250002_add_award_reward_event_rpc.sql` — `public.award_reward_event(...)` RPC.
- `supabase/migrations/202605060002_guard_reward_event_idempotency.sql` — `(user_id, event_key)` uniqueness guard.

The frontend wrapper is in `src/services/rewardEventService.js`. The decision gate is `isBackendRewardSyncEnabled(env)` at the top of that file:

```js
export function isBackendRewardSyncEnabled(env = getImportMetaEnv()) {
  return normalizeBooleanFlag(env?.VITE_REWARD_BACKEND_SYNC_ENABLED);
}
```

`VITE_REWARD_BACKEND_SYNC_ENABLED=false` in `.env.example`. When the flag is off, the backend code path short-circuits to a `DISABLED` status, the local ledger remains the source of truth, and `rewardRuntime` continues unchanged.

### Deferred improvement

Flip `VITE_REWARD_BACKEND_SYNC_ENABLED` to `true` in production after the migrations are applied to a live Supabase project and authenticated cross-device idempotency has been verified. After the flip, learners earn rewards once across devices instead of once per device.

### Why the flag stays off

Local SQL review and unit tests cannot verify three things that only a live Supabase project can:

- **RLS policies in practice.** The migrations grant access through `auth.uid()`-derived ownership. The behaviour under an authenticated session can only be validated by signing in as a real test learner and observing that the RPC accepts the call, the row appears with the correct `user_id`, and a second learner cannot read it.
- **Cross-device idempotency.** The unique constraint on `(user_id, event_key)` is what stops a learner from earning the same reward twice across devices. The constraint must be exercised against a real RPC by emitting the same event key from two browsers signed in as the same learner and confirming the second call returns the existing row.
- **Schema drift.** Migrations applied via Supabase CLI vs the SQL editor can land in different orders. The `npm run check:supabase-readiness` gate verifies migration files are present in the repo; it cannot verify they were applied. Only a project-level inspection can.

### Blocking dependency

Live Supabase staging access:

- Staging project URL and anon key.
- A test learner account that can sign in through the deployed app.
- Supabase SQL editor or CLI access to run the validation queries in `docs/staging-supabase-validation.md`.
- Two browsers (or two devices) signed in as the same test learner for the cross-device idempotency check.

### Risk if ignored

- **Reward integrity story stays "single device."** This is documented honestly in `KNOWN_LIMITATIONS.md`, but the public Progress Summary PDFs and the topbar level/streak displays imply durability the platform does not provide cross-device. Closing this gap is the single largest portfolio upgrade left.
- **Migration drift.** The longer the migrations sit unapplied, the more likely a future migration lands assuming the older ones are present in production, producing a hidden ordering bug that will only surface during the eventual rollout.
- **Stale validation runbook.** `docs/staging-supabase-validation.md` is current today. Each schema change to the reward path adds another item the runbook must verify before the flip.

### Recommended rollout strategy

1. **Apply migrations to staging.** Use Supabase CLI or the SQL editor. Confirm migration timestamps applied in order (`202604250001` → `202604250002` → `202605060002`).
2. **Run `npm run check:supabase-readiness`.** This is a static gate that confirms the repo expectations match the migrations on disk. It does not replace the live validation.
3. **Walk the staging validation runbook.** `docs/staging-supabase-validation.md` lists every required check. Record results in the staging release log; do not skip items.
4. **Canary.** Set `VITE_REWARD_BACKEND_SYNC_ENABLED=true` for the staging frontend only. Sign in as the test learner and emit each reward type once: lesson complete, quiz complete, quiz perfect, challenge complete. Confirm one row per `event_key` in `public.reward_events`.
5. **Cross-device check.** From a second browser signed in as the same learner, repeat the same reward events. Confirm the RPC returns the existing rows and the local UI does not double-award XP.
6. **Production flip.** Apply the same migrations to production. Set `VITE_REWARD_BACKEND_SYNC_ENABLED=true` in the production environment. The local engine remains the fallback if Supabase is unreachable.
7. **Rollback contract.** If duplicate XP, missing rewards, or RPC errors appear in the first 24 hours, set `VITE_REWARD_BACKEND_SYNC_ENABLED=false` and redeploy. The local engine resumes as the source of truth without data loss; queued retries from the disabled period are inspectable via the local diagnostics surface in `rewardDiagnostics.js`.
8. **Monitoring.** Watch Sentry for `BACKEND_REWARD_STATUSES.FAILED` diagnostics emitted from `rewardEventService.js`. Watch the `reward_events` table for unexpected `status` values. The first 24 hours after a flip are the canary window.

### Related artifacts

- `supabase/migrations/202604250001_create_reward_events.sql`
- `supabase/migrations/202604250002_add_award_reward_event_rpc.sql`
- `supabase/migrations/202605060002_guard_reward_event_idempotency.sql`
- `src/services/rewardEventService.js` — backend wrapper, feature flag.
- `src/engine/rewards/rewardRuntime.js` — orchestration that consults the flag.
- `src/engine/rewards/rewardLedger.js`, `rewardQueue.js`, `rewardReconciliation.js` — local fallback.
- `scripts/check-supabase-readiness.mjs` — static repo gate.
- `scripts/check-staging-validation-runbook.mjs` — runbook drift gate.
- `docs/staging-supabase-validation.md` — required live-validation checklist.
- `docs/supabase-production-readiness.md` — companion checklist for production.
- `docs/backend-reward-events.md` — table + RPC reference.
- `docs/reward-sync-strategy.md` — runtime decision matrix.
- `.env.example` — defines the flag default.

---

## Required External Dependencies

Neither risk can land using only changes inside this repository.

- **Risk A** needs a curriculum owner who can author structured-format React lessons. Engineering can build the audit gate, the migration scaffold, and the per-lesson PR pipeline. Engineering cannot write pedagogically sound content.
- **Risk B** needs a Supabase staging project with CLI/SQL editor access, plus credentials for a test learner. Engineering can run the validation runbook against staging; engineering cannot create the staging project itself.

If you are picking up either risk, confirm the external dependency is satisfied before opening a migration PR. Half-finished work in either area is worse than the deferred state, because both rely on visible content or visible reward integrity.

## Rollback / Safety Notes

- **Risk A is reversible at the file level.** Each per-lesson migration PR is independent. Reverting a single PR removes only that lesson's structured content; the legacy file in `src/data/react/modules/` can be restored from history. The dual-render branch in `LessonView.jsx` stays in place until the very last PR removes it.
- **Risk B's rollback is the feature flag.** `VITE_REWARD_BACKEND_SYNC_ENABLED=false` returns the platform to local-only behavior immediately on redeploy. Local ledger state is unaffected by the flip. Rows already written to `public.reward_events` remain; they simply stop being consulted on the hot path.
- **Migration cleanup is not part of either rollback.** Database migrations once applied should not be reverted to roll back a flag flip. The `reward_events` table is harmless when the flag is off.

## Recommended Next Steps

In order, lowest risk first:

1. Add `scripts/audit-lesson-format.mjs` and wire it into `check:quality`. This is internal-only and lockable today.
2. Migrate one React module to the structured shape as a worked reference. Treat it as a curriculum review pass, not a code change.
3. Apply the reward-events migrations to a Supabase staging project. Run the staging validation runbook end to end. Record results.
4. Canary the flag in staging; confirm cross-device idempotency.
5. Flip the production flag. Watch for 24 hours.
6. Migrate the remaining React modules at curriculum-owner pace, one module per PR, removing legacy imports as each lands.
7. Delete `RichLessonBody.jsx` and its branch in `LessonView.jsx` when the audit reports zero legacy lessons.

These are sequenced so that step `n+1` cannot regress step `n`.

## Related Files / Scripts / Migrations

Quick index for grep:

```
src/components/learning/LessonView.jsx
src/components/learning/StructuredLessonBody.jsx
src/components/learning/RichLessonBody.jsx
src/data/react/course.js
src/data/react/modules/*.js
src/engine/rewards/rewardLedger.js
src/engine/rewards/rewardQueue.js
src/engine/rewards/rewardReconciliation.js
src/engine/rewards/rewardRuntime.js
src/services/rewardEventService.js
scripts/audit-learning-content.mjs
scripts/check-lesson-labels.mjs
scripts/check-supabase-readiness.mjs
scripts/check-staging-validation-runbook.mjs
supabase/migrations/202604250001_create_reward_events.sql
supabase/migrations/202604250002_add_award_reward_event_rpc.sql
supabase/migrations/202605060002_guard_reward_event_idempotency.sql
docs/backend-reward-events.md
docs/reward-sync-strategy.md
docs/staging-supabase-validation.md
docs/supabase-production-readiness.md
KNOWN_LIMITATIONS.md
.env.example
```
