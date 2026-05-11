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
- Admin rollups filtered by `public.is_admin()` with invoker-aware view semantics.
- Explicit anon `select` revokes for raw profile/progress/reward-adjacent tables.
- Reward event ledger migrations and the `award_reward_event(...)` RPC that derives ownership from `auth.uid()`.
- The `reward_catalog` migration that lets the RPC derive XP and reject unknown reward entities.
- The idempotency guard for `(user_id, event_key)` reward events.
- The hardened reward catalog migration that derives backend XP and canonical reward event keys server-side.
- Unique Supabase migration timestamp prefixes, so no migration is skipped
  or mis-reconciled by version.

This is a source-control guard. Passing it means the schema and migration artifacts are present; it does not mean the live Supabase project has applied them.

## Live Deployment Checklist

Use this checklist before pointing a public preview or production build at a Supabase project. Record the project ref, deploy SHA, tester, and date in the release notes.

- Run `npm run check:supabase-readiness` on the exact commit being deployed.
- Apply missing migrations in timestamp order and record which files were applied.
- Confirm `public.last_position` includes the stable resume columns before testing resume behavior.
- Confirm raw learner tables do not grant anon `SELECT`; public sharing should read from `public.public_profiles` only.
- Run the RLS smoke checks below with one authenticated learner and one second learner id.
- Run `npm run test:e2e:auth:preflight` with the same secrets that CI or the hosted preview will use.
- Run authenticated smoke tests only when the four required E2E secrets are present. Do not mark signed-in persistence as verified from public smoke tests alone.
- Keep `VITE_REWARD_BACKEND_SYNC_ENABLED=false` outside staging until `docs/staging-supabase-validation.md` has a completed live validation record.
- Store rollback notes for the deployed environment before enabling any backend reward sync flags.

## Migration Order

For a fresh Supabase project, apply `supabase-schema.sql` first, then apply the additive migration files in timestamp order:

1. `supabase/migrations/202604250001_create_reward_events.sql`
2. `supabase/migrations/202604250002_add_award_reward_event_rpc.sql`
3. `supabase/migrations/202605060001_guard_profile_disabled_updates.sql`
4. `supabase/migrations/202605060002_guard_reward_event_idempotency.sql`
5. `supabase/migrations/202605060003_harden_profile_updates.sql`
6. `supabase/migrations/202605070001_add_stable_last_position_columns.sql`
7. `supabase/migrations/202605070002_harden_public_profile_privacy.sql`
8. `supabase/migrations/202605110001_harden_reward_event_trust_boundaries.sql`
9. `supabase/migrations/202605110002_lock_admin_user_rollups.sql`

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

### RLS Smoke Checks

Use an authenticated SQL session or API client for the test learner. Replace placeholders with real ids from the staging project.

```sql
select *
from public.progress
where user_id = '<other-learner-user-id>';
```

Expected: zero rows for a different learner.

```sql
select *
from public.public_profiles
where id = '<public-profile-id>';
```

Expected: aggregate profile fields only. Raw lesson keys, quiz keys, and reward event rows should not appear through this view.

```sql
insert into public.reward_events (user_id, event_type, event_key, xp_amount, source)
values ('<other-learner-user-id>', 'lesson_complete', 'manual-test', 25, 'rls-smoke');
```

Expected: rejected unless executed through an approved server/RPC path that derives ownership from `auth.uid()`.

## Authenticated E2E Secrets

Authenticated Playwright coverage needs all four repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `E2E_EMAIL`
- `E2E_PASSWORD`

If any are missing, CI runs public checks and skips authenticated E2E instead of pretending the signed-in flow passed. Once all four are present, the preflight fails closed on placeholders, localhost Supabase URLs, invalid URLs, or unreachable Supabase hosts.

## Backend Reward Sync Boundary

The reward event ledger is present, but broad backend reward sync remains behind `VITE_REWARD_BACKEND_SYNC_ENABLED`. Do not enable it beyond staging until `docs/staging-supabase-validation.md` has been completed with a real authenticated learner and no duplicate XP, RLS, or replay failures.
