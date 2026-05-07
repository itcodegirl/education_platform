# Staging Supabase Validation Runbook

This runbook is the required live validation checklist for enabling backend reward sync in a real Supabase staging project. Local SQL checks and unit tests are not enough to clear production readiness.

Do not enable backend sync beyond staging until every required validation item passes with an authenticated learner.

## Current Status

Backend sync is code-ready behind `VITE_REWARD_BACKEND_SYNC_ENABLED`, but it is not production-verified. Real Supabase authenticated flows were not run because staging access was unavailable.

Production readiness remains blocked until this checklist is executed against staging and the results are recorded.

## Required Access

- Supabase project URL for the staging project.
- Supabase anon key for the same staging project.
- Test learner account that can sign in through the app.
- Supabase SQL editor or Supabase CLI access for the staging project.
- Ability to inspect table rows and RPC results for the authenticated test learner.

## Required Environment Variables

Set these in the staging frontend environment before testing:

```env
VITE_SUPABASE_URL=<staging-project-url>
VITE_SUPABASE_ANON_KEY=<staging-anon-key>
VITE_REWARD_BACKEND_SYNC_ENABLED=true
```

Confirm the running staging build is using these values before starting validation.

## Required Migrations

Apply and verify the current repo migrations before running browser tests. Run the static source-control gate first:

```bash
npm run check:supabase-readiness
```

Then apply `supabase-schema.sql` followed by the additive files listed in [Supabase Production Readiness](./supabase-production-readiness.md).

Required database objects after migration:

- `public.reward_events`
- `public.award_reward_event(...)`
- Stable resume columns on `public.last_position`: `course_id`, `module_id`, `lesson_id`, `is_module_quiz`
- Aggregate public profile view: `public.public_profiles`

The current backend reward migration set must include or preserve:

- `award_reward_event` RPC
- RLS on reward event tables
- Authenticated-only RPC grants
- Auth-owned backend RPCs. `award_reward_event` derives the learner from `auth.uid()` and must not accept a client-provided user id.

Challenge completion and daily/streak server-authoritative tables remain follow-up backend sync work unless a later migration adds them. Keep those validation sections as release blockers only when that backend feature is being enabled.

## Manual Test Checklist

Use one authenticated test learner. Record the learner email, Supabase user id, staging URL, build SHA or deploy id, tester, and test date in the validation notes.

### 1. Lesson Completion

- Sign in as the test learner.
- Start a lesson that has not been completed by this learner.
- Complete the lesson once.
- Confirm the UI awards the expected XP once.
- Reload the page.
- Confirm the lesson remains completed.
- Confirm XP does not duplicate after reload.
- Inspect Supabase and confirm one `reward_events` row exists for the lesson event key.

Pass criteria: one reward event, one XP award, no duplicate XP after reload.

### 2. Duplicate Reward

- Trigger the same lesson or reward event twice for the same learner.
- Confirm the UI does not inflate XP on the second attempt.
- Inspect the RPC response if available and confirm the backend returns a skipped or equivalent duplicate result.
- Inspect `reward_events` and confirm no second row is created for the same `(user_id, event_key)`.

Pass criteria: duplicate attempt is skipped by the backend and XP remains stable.

### 3. Quiz Reward

- Sign in as the test learner.
- Submit a valid quiz attempt that should award XP.
- Confirm the reward path works and XP updates once.
- Retry or resubmit the same quiz reward path.
- Confirm XP does not inflate.
- Inspect `reward_events` for quiz event keys such as base quiz reward and perfect-score reward when applicable.

Pass criteria: valid quiz reward is awarded once per stable event key; retry does not inflate XP.

### 4. Challenge Completion

- Complete a challenge as the test learner.
- Confirm the UI marks the challenge complete.
- Reload the page.
- Confirm the challenge remains complete.
- Open a second browser, private window, or separate session as the same learner.
- Confirm the challenge completion syncs across sessions.
- Inspect `challenge_completions` for the expected `challenge_id` record.

Pass criteria: completion persists after reload and appears in a second session for the same learner.

### 5. Daily And Streak

- Trigger a learning activity that records daily progress.
- Confirm the UI applies the optimistic daily/streak update.
- Wait for backend reconciliation to complete.
- Confirm the UI settles to the backend canonical daily count and streak values.
- Inspect the daily/streak tables and `daily_activity_events`.
- Trigger the same activity again on the same day.
- Confirm the duplicate daily activity does not inflate the canonical daily count.

Pass criteria: optimistic UI reconciles to server-owned values without duplicate daily/streak inflation.

### 6. Offline And Online Replay

- Sign in as the test learner with backend sync enabled.
- Simulate backend failure without signing out. Examples: block Supabase network calls, temporarily break the staging Supabase URL in a local staging build, or use browser devtools to force offline behavior for Supabase requests.
- Complete a rewardable action.
- Confirm local UX still works and the learner is not blocked.
- Confirm the retry queue stores the failed reward event evidence.
- Restore backend connectivity.
- Reload or trigger the authenticated load path that replays retryable reward events.
- Confirm the backend awards the queued event once.
- Repeat reload.
- Confirm the replay does not award a second time.
- Inspect `reward_events` and XP totals.

Pass criteria: local fallback works, retry evidence persists, replay awards once, and no XP inflation occurs.

## SQL Inspection Checklist

Run these checks from the Supabase SQL editor or CLI with access to the staging project. Replace placeholders with the authenticated test learner id and event keys from the manual tests.

### Reward Event Idempotency

```sql
select user_id, event_key, count(*) as row_count
from public.reward_events
where user_id = '<test-learner-user-id>'
group by user_id, event_key
having count(*) > 1;
```

Expected result: zero rows.

```sql
select event_type, event_key, xp_amount, status, source, created_at, processed_at
from public.reward_events
where user_id = '<test-learner-user-id>'
order by created_at desc;
```

Expected result: one row per learner/event key, with no duplicate reward rows from retry tests.

### Challenge Completion Persistence

```sql
select user_id, challenge_id, completed_at
from public.challenge_completions
where user_id = '<test-learner-user-id>'
order by completed_at desc;
```

Expected result: expected challenge ids are present once for the learner.

### Daily And Streak Canonical Values

```sql
select user_id, activity_date, activity_key, created_at
from public.daily_activity_events
where user_id = '<test-learner-user-id>'
order by created_at desc;
```

Expected result: duplicate same-day activity keys do not create duplicate canonical daily activity rows.

Also inspect the existing daily/streak aggregate tables used by the app and confirm the UI matches backend canonical values after reconciliation.

### RPC Auth Ownership

While authenticated as the test learner, confirm `award_reward_event` has no `learner_id` or `user_id` argument and derives ownership from `auth.uid()`. Then attempt a duplicate reward event for the same learner/event key.

Expected result: `award_reward_event` inserts at most one row for `(user_id, event_key)`, returns a skipped duplicate result on repeat, and does not increment XP twice.

If validating an RPC that accepts `learner_id`, call it with a different learner id.

Expected result: `record_daily_activity` rejects the mismatch and does not create a daily activity event.

### RLS Isolation

Using the authenticated test learner session:

- Attempt to read another learner's `reward_events`.
- Attempt to read another learner's `challenge_completions`.
- Attempt to read another learner's `daily_activity_events`.
- Attempt direct browser writes to protected reward tables, if tooling allows.

Expected result: reads and writes for another learner are blocked by RLS. Reward writes must go through the RPC path.

## Production Readiness Gate

Backend sync can be enabled beyond staging only if all of these are true:

- Migration applied successfully in staging.
- One authenticated learner completes every validation test in this runbook.
- Duplicate reward test passes.
- Offline replay test passes.
- Challenge cross-session test passes.
- Daily/streak reconciliation passes.
- No XP inflation is observed.
- No RLS failures are observed.
- Rollback plan is documented and reviewed.

## Rollback Plan Requirement

Before enabling broadly, document the exact rollback steps for the target environment:

- Set `VITE_REWARD_BACKEND_SYNC_ENABLED=false`.
- Redeploy or revert the frontend environment to disable backend reward sync.
- Preserve `reward_events`, `challenge_completions`, and `daily_activity_events` for audit unless data cleanup is explicitly approved.
- Record any affected learner ids, event keys, and XP totals before cleanup.
- Do not delete staging or production reward evidence as a first response to validation failure.

## Validation Record Template

Copy this block into the validation ticket or release notes after the run:

```md
Staging Supabase validation date:
Tester:
Staging URL:
Build SHA / deploy id:
Supabase project:
Test learner email:
Test learner user id:

Migrations applied:
- reward_events:
- award_reward_event RPC:
- backend trust progress sync:

Manual tests:
- Lesson completion:
- Duplicate reward:
- Quiz reward:
- Challenge completion:
- Daily/streak:
- Offline/online replay:

SQL inspection:
- reward_events idempotency:
- challenge_completions:
- daily/streak:
- RPC auth ownership:
- RLS isolation:

Observed XP inflation:
Observed RLS failure:
Rollback plan link:

Decision:
- Keep staging only / enable beyond staging / block release
```
