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

- Fix lesson/quiz identity mismatches
- Harden completion, XP, streak, and challenge progression rules
- Ensure search indexes intended learning content consistently

Exit criteria:

- Core learning loop cannot be easily gamed or silently desynced.

## P2: Data Model Hardening + Migration Safety

Goal: move persistence from fragile labels to stable identifiers.

- Replace string/display-label keys with stable IDs
- Unify course/module/lesson/quiz/challenge/badge identity model
- Define safe migration strategy for existing local storage and Supabase records

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
- Tighten release checklist around verified behavior

Exit criteria:

- Critical user journeys are covered by repeatable, actionable automated checks.

