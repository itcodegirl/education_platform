# Learner State Model

This map describes learner-owned state, where it is trusted today, and what must change before CodeHerWay can claim production-grade cross-device learning continuity.

| State | Current owner | Current trust level | Production-ready target |
| --- | --- | --- | --- |
| Auth profile | Supabase Auth/profile tables | Backend trusted when configured | Keep RLS verified and block app shell on profile verification failure |
| Lesson completions | Supabase when connected plus local fallback | Partially synced | Stable lesson IDs, migration-safe saved position, recoverable route actions |
| Saved position | Display labels plus stable IDs where available | Compatibility mode | Stable course/module/lesson IDs as primary resolver |
| Bookmarks | Supabase when connected plus local fallback | Partially synced | Stable lesson IDs and user-scoped local fallback keys |
| Lesson notes | Supabase when connected plus browser queue behavior | Partially synced | User-scoped local queue and backend observability for failed writes |
| XP total | Local reward ledger with feature-gated backend path | Single-device today | Backend reward events with idempotent RPC and duplicate-award tests |
| Streaks | Local reward engine and progress display guards | Single-device today | Backend activity records with one award per day window |
| Badges | Local badge eligibility over local progress/reward state | Single-device today | Backend badge award records keyed by stable badge ids |
| Review queue | Local spaced-repetition state | Single-device today | Backend SR cards or explicit local-only product positioning |
| Challenge completions | Local challenge completion history | Single-device today | Backend challenge attempt/completion records with stable challenge ids |
| Progress Summary PDF | Client-generated from current app state | Informational only | Verified certificate only after server-backed completion records exist |

## State Categories

Backend-trusted today:

- Auth identity and session.
- Learner profile records when Supabase is configured and profile verification succeeds.

Partially synced today:

- Lesson completions.
- Bookmarks.
- Notes.
- Saved position compatibility fields.

Local/single-device today:

- XP.
- Streaks.
- Badges.
- Review queue.
- Challenge completions.
- Reward retry/ledger diagnostics.

Informational only:

- Progress Summary PDF.
- In-app badges as motivational milestones.

## Phase 3 Priorities

1. Make stable IDs the primary persisted identity for saved position, lesson completion, bookmarks, quizzes, challenges, and badges.
2. Scope localStorage and local ledger keys by signed-in learner identity.
3. Consolidate route actions and service mutations around one recoverable write descriptor.
4. Move reward events, streak activity, badge awards, SR state, and challenge completions to backend-backed idempotent records.
5. Decide whether existing local reward ledger data is imported, ignored, or shown as local-only history.
