# Repair Roadmap

This roadmap tracks staged stabilization work from audit findings. It is intentionally incremental and evidence-driven.

## P0: Repo Trust + Documentation

Goal: make the canonical app path, product identity, and project status unambiguous.

- Canonical repo surface cleanup
- Brand and claim alignment
- Transparency documentation baseline

Exit criteria:

- Recruiter-visible docs are accurate and consistent with implemented behavior.
- Archived code is clearly labeled as non-canonical.

## P1: Learning Integrity

Goal: make learner progress and completion signals trustworthy.

Current quiz checkpoint:

- Active HTML, CSS, JavaScript, and React lesson quiz coverage is complete.
- Python quiz coverage is intentionally deferred and should start with module checkpoint policy decisions.
- Quiz variant groups and legacy orphan quiz inventory are now classified and monitored through `npm run audit:quizzes`.
- Strict-mode quiz audit CI criteria are still planned, not enabled as a release gate.

Current progress/reward checkpoint:

- Lesson completion XP uses stable reward keys to prevent same-device uncomplete/recomplete farming.
- Quiz retries remain available for learning, while base quiz XP and perfect-score bonus XP are awarded once per stable quiz key.
- Streaks now advance from explicit learning actions instead of app load, while preserving existing UTC date semantics.
- Challenge completion is persisted and deduped for same-device learning motivation, but is not secure certification.
- Core localStorage and route-action write failures mark sync-failed state instead of failing completely silently.

Remaining hardening:

- Maintain completed active lesson quiz coverage for HTML, CSS, JavaScript, and React
- Keep Python quiz coverage as explicit roadmap scope; define module checkpoint quizzes before deciding on full lesson-level coverage
- Continue legacy alias review and monitor classified orphan/variant drift through `npm run audit:quizzes`
- Use the reward/progress trust policy in `docs/reward-progress-policy.md` as the source of truth for future schema-backed reward hardening
- Add server-side reward-event tracking or an equivalent atomic XP award operation for cross-device idempotency
- Move challenge completion history toward backend-backed persistence when the data model is ready
- Add durable retry/reconciliation for failed progress writes
- Decide whether learner-local streak dates should replace the current UTC date semantics
- Ensure search indexes intended learning content consistently

Exit criteria:

- Active frontend-track quiz coverage remains complete, Python scope is explicit, and remaining audit findings stay classified with documented owner/decision status.
- Core same-device learning loop cannot be easily gamed or silently desynced; full cross-device reward integrity waits for P2 data-model hardening.

## P2: Data Model Hardening + Migration Safety

Goal: move persistence from fragile labels to stable identifiers.

- Replace string/display-label keys with stable IDs
- Unify course/module/lesson/quiz/challenge/badge identity model
- Define safe migration strategy for existing local storage and Supabase records
- Decide targeted compatibility handling for renamed HTML Module 102 lesson progress/bookmark keys

Exit criteria:

- Data model supports growth without identity collisions or migration ambiguity.

## P3: ADHD-Friendly UX Simplification

Goal: reduce cognitive load and increase next-step clarity.

- Reduce overlay stacking and competing panel states
- Clarify one primary next action in signed-in shell
- Improve keyboard/focus behavior and interaction predictability

Exit criteria:

- Task flow feels clear, low-friction, and momentum-preserving.

## P4: Reliability Testing + CI Gates

Goal: raise confidence with targeted regression coverage and enforceable quality gates.

- Add tests for learning flow, progress integrity, XP/streaks, search, bookmarks, auth, and accessibility
- Expand CI gates around build/test quality checks
- Define future strict-mode CI criteria for quiz integrity once orphan, variant, alias, and Python policy decisions are complete
- Tighten release checklist around verified behavior

Exit criteria:

- Critical user journeys are covered by repeatable, actionable automated checks.
