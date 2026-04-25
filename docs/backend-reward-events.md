# Backend Reward Events

This document records the current Supabase reward-event checkpoint for the progress/reward engine.

## Current Status

The backend reward engine is scaffolded but not assumed to be live in every environment.

Implemented on this branch:

- `supabase/migrations/202604250001_create_reward_events.sql`
- `supabase/migrations/202604250002_add_award_reward_event_rpc.sql`
- `src/services/rewardEventService.js`
- Feature-gated integration from the local reward runtime

Not implemented on this branch:

- Automatic local reward backfill/import
- Durable retry queue for failed backend writes
- Server-side challenge certification
- Service-role browser access

The earlier `feat/reward-retry-reconciliation` branch is not merged into this branch or `main`; its retry/reconciliation utilities are intentionally not recreated here.

## Reward Events Table

`public.reward_events` is the backend idempotency ledger.

Key fields:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id)`
- `event_key text not null`
- `event_type text not null`
- `entity_id text not null`
- `xp_amount integer not null`
- `metadata jsonb not null default '{}'`
- `status text not null default 'processed'`
- `source text`
- `created_at timestamptz`
- `processed_at timestamptz`
- `updated_at timestamptz`

The important trust boundary is `unique (user_id, event_key)`. That constraint prevents duplicate XP for the same stable reward key when writes go through the RPC.

## Supported Event Types

The first backend checkpoint supports the same reward types as the local reward engine:

- `LESSON_COMPLETE`
- `QUIZ_BASE`
- `QUIZ_PERFECT`
- `CHALLENGE_COMPLETE`

XP amounts are still defined by existing app policy. This backend phase does not change XP values.

## RLS And Write Policy

RLS is enabled on `public.reward_events`.

Direct browser access is intentionally narrow:

- Learners can read their own reward events.
- Admins can read all reward events through the existing admin helper policy.
- Direct browser insert/update/delete policies are not added.

Reward writes should go through `public.award_reward_event()`, which derives identity from `auth.uid()` and does the event insert plus XP increment atomically.

## Atomic Award RPC

`public.award_reward_event()` accepts:

- `p_event_key`
- `p_event_type`
- `p_entity_id`
- `p_xp_amount`
- `p_metadata`
- `p_source`

It returns:

- `status`: `awarded`, `skipped`, or `failed`
- `event_key`
- `xp_awarded`
- `total_xp`
- `reason` when failed

The RPC never accepts `user_id` from the client.

## Frontend Wrapper

`src/services/rewardEventService.js` normalizes RPC behavior into:

- `awarded`
- `skipped`
- `failed`
- `disabled`

Normal fallback cases should not throw. Missing Supabase config, disabled backend sync, or an unavailable Supabase client return `disabled` so local reward behavior can continue.

## Release Notes

Before enabling backend reward sync in an environment:

1. Apply `supabase-schema.sql` if the project is new.
2. Apply the reward migration files in order.
3. Confirm `public.award_reward_event()` is executable by authenticated users only.
4. Confirm direct client writes to `reward_events` are blocked.
5. Set `VITE_REWARD_BACKEND_SYNC_ENABLED=true` only after authenticated duplicate-award testing passes.

Keep the flag disabled for local demos or projects that have not applied the migrations.
