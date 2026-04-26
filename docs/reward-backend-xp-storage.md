# Backend XP Storage Decision

Phase 15 determines where server-authoritative reward XP should be stored.

## Existing Backend Storage

The current Supabase schema already defines `public.xp`:

- `user_id uuid references auth.users on delete cascade primary key`
- `total integer default 0`
- `updated_at timestamptz default now()`

Existing code and schema paths already depend on this table:

- `src/services/progressService.js` reads `xp.total` during `fetchAllUserData()`.
- `src/services/progressService.js` writes `xp.total` through `updateXP()`.
- `public.handle_new_user()` inserts an `xp` row on signup.
- Admin dashboard metrics read `public.xp`.
- Public profile projection reads `public.xp`.

## Evaluated Options

`profiles`

- Rejected for this phase.
- It would mix identity/profile fields with reward accounting.
- It would require broader reads/writes and public-profile policy review.

`progress`

- Rejected for this phase.
- It tracks completed lessons, not aggregate rewards.
- Adding XP totals there would blur event history and lesson completion.

New `learner_progress`

- Deferred.
- It could be cleaner long term, but it would duplicate the existing `xp` source of truth and require compatibility/backfill decisions.

Existing `xp`

- Recommended for this phase.
- It preserves current app behavior and backend reporting.
- It allows `award_reward_event()` to increment the same total the app already reads.

## Recommendation

Use `public.xp` as the backend XP total table for the first server-authoritative reward engine.

The new `public.reward_events` table becomes the idempotency/event-history source of truth. The existing `public.xp.total` remains the aggregate total updated atomically by the reward RPC.

## Compatibility Notes

- No `learner_progress` table is created in this phase.
- No localStorage migration is required.
- Existing local reward history remains the same-device fallback.
- Existing direct client `updateXP()` remains in place until backend reward sync is explicitly enabled and proven safe.
- A future data-model phase can move from `xp` to `learner_progress` if there is a broader migration plan.

## Risks

- The existing `xp` table does not record why XP changed; `reward_events` addresses this going forward.
- Existing rows may already reflect local/client-side XP history without backend reward events.
- Backfill/import must not blindly trust local data without a deliberate learner action and reconciliation policy.
