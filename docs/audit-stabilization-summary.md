# Audit Stabilization Summary

This PR hardens CodeHerWay as a portfolio-ready learning platform demo. It does not turn the app into production credentialing infrastructure.

## What Was Hardened

- Progress Summary downloads are framed as learning records, not verified certificates.
- Saved lesson resume now prefers stable course, module, lesson, and quiz identifiers with legacy label fallback.
- Resume loads the saved course before selecting a module or lesson, avoiding stale selections from a previously active course.
- Learner-adjacent local state now uses per-learner storage keys with a guest namespace for signed-out preview state.
- Roadmap jumps load the target course before selecting a module.
- Public profile SQL exposes aggregate profile stats through `public_profiles`; raw progress rows and lesson keys are not intentional public data.
- Quiz choices use native radio semantics for single-answer questions.
- Challenge grading copy explains that tests check exercise-specific requirements, not full skill verification.
- Progress stats derive quiz averages from stable lesson/module IDs instead of display labels or course-name prefixes.
- Learning tool labels and mobile tool wiring are centralized in the shared tool registry.
- Authenticated persistence tests now cover account switching and learner-scoped pending write queues.
- Supabase production readiness docs are part of the static gate, including live deployment, RLS smoke checks, and authenticated E2E secret boundaries.
- Mobile tools render from the shared registry with compact icons and constrained labels for narrow screens.
- Lesson completion copy now consistently means saved reading progress; quizzes and challenges remain separate checks.
- Lesson completion button labels are derived from a shared helper so topbar and mobile nav semantics cannot drift.

## Honest Limits

- XP, streaks, badges, review cards, and challenge completions remain motivational product signals.
- Cross-device reward integrity is still feature-gated until Supabase migrations and authenticated duplicate-award flows are verified.
- Public profile pages show aggregate progress only.
- Progress Summary downloads reflect current app progress and are not server-authoritative credentials.

## Follow-Up

- Run authenticated Playwright flows in CI with real Supabase test credentials.
- Run `npm run check:supabase-readiness` before persistence-related releases, then apply the listed migrations and live RLS smoke checks to the target Supabase project.
- Apply the additive Supabase migrations before enabling backend reward sync.
- Continue decomposing `ProgressContext` and `AppLayout` in small, behavior-preserving steps.
