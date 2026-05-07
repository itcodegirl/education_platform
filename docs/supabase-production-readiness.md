# Supabase Production Readiness

This checklist keeps CodeHerWay honest about persistence readiness. It verifies the repo artifacts that protect resume state, public profile privacy, and reward event idempotency. It does not replace a live Supabase staging validation run.

## Static Gate

Run this before opening or merging persistence-related PRs:

```bash
npm run check:supabase-readiness
```

The command verifies that the repo still contains:

- Stable saved-position columns on `public.last_position`: `course_id`, `module_id`, `lesson_id`, `is_module_quiz`.
- The additive stable resume migration: `supabase/migrations/202605070001_add_stable_last_position_columns.sql`.
- Aggregate-only public profile exposure through `public.public_profiles`.
- Explicit anon `select` revokes for raw profile/progress/reward-adjacent tables.
- Reward event ledger migrations and the `award_reward_event(...)` RPC that derives ownership from `auth.uid()`.
- The idempotency guard for `(user_id, event_key)` reward events.
- Unique Supabase migration timestamp prefixes, so no migration is skipped
  or mis-reconciled by version.

This is a source-control guard. Passing it means the schema and migration artifacts are present; it does not mean the live Supabase project has applied them.

## Migration Order

For a fresh Supabase project, apply `supabase-schema.sql` first, then apply the additive migration files in timestamp order:

1. `supabase/migrations/202604250001_create_reward_events.sql`
2. `supabase/migrations/202604250002_add_award_reward_event_rpc.sql`
3. `supabase/migrations/202605060001_guard_profile_disabled_updates.sql`
4. `supabase/migrations/202605060002_guard_reward_event_idempotency.sql`
5. `supabase/migrations/202605060003_harden_profile_updates.sql`
6. `supabase/migrations/202605070001_add_stable_last_position_columns.sql`
7. `supabase/migrations/202605070002_harden_public_profile_privacy.sql`

For an existing project, apply only migrations that have not already run. Every listed file is intended to be additive/idempotent, but production operators should still record the run date, project ref, and deploy SHA.

## Live Verification

After migrations are applied, verify these with the Supabase SQL editor or CLI:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'last_position'
  and column_name in ('course_id', 'module_id', 'lesson_id', 'is_module_quiz');
```

Expected: four rows.

```sql
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon'
  and table_schema = 'public'
  and table_name in ('profiles', 'xp', 'streaks', 'progress', 'badges');
```

Expected: no raw-table `SELECT` grants for anon. Public profile sharing should happen through `public.public_profiles`.

```sql
select event_key, count(*)
from public.reward_events
group by event_key
having count(*) > 1;
```

Expected: zero duplicate event keys per learner after staging reward tests. Use a learner-scoped version of this query during manual validation.

## Authenticated E2E Secrets

Authenticated Playwright coverage needs all four repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `E2E_EMAIL`
- `E2E_PASSWORD`

If any are missing, CI runs public checks and skips authenticated E2E instead of pretending the signed-in flow passed. Once all four are present, the preflight fails closed on placeholders, localhost Supabase URLs, invalid URLs, or unreachable Supabase hosts.

## Backend Reward Sync Boundary

The reward event ledger is present, but broad backend reward sync remains behind `VITE_REWARD_BACKEND_SYNC_ENABLED`. Do not enable it beyond staging until `docs/staging-supabase-validation.md` has been completed with a real authenticated learner and no duplicate XP, RLS, or replay failures.
