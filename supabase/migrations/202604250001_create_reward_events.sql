-- Phase 14: server-authoritative reward event ledger.
-- Additive migration. It does not replace the current local reward ledger.

create table if not exists public.reward_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null check (char_length(event_key) <= 240),
  event_type text not null check (
    event_type in (
      'LESSON_COMPLETE',
      'QUIZ_BASE',
      'QUIZ_PERFECT',
      'CHALLENGE_COMPLETE'
    )
  ),
  entity_id text not null check (char_length(entity_id) <= 160),
  xp_amount integer not null check (xp_amount >= 0),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'processed' check (
    status in ('pending', 'processed', 'skipped', 'failed', 'reconciled')
  ),
  source text check (source is null or char_length(source) <= 80),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint reward_events_user_event_key_key unique (user_id, event_key)
);

alter table public.reward_events enable row level security;

drop policy if exists "Users read own reward events" on public.reward_events;
create policy "Users read own reward events"
  on public.reward_events
  for select
  using (auth.uid() = user_id);

drop policy if exists "Admins read all reward events" on public.reward_events;
create policy "Admins read all reward events"
  on public.reward_events
  for select
  using (public.is_admin());

-- No direct browser INSERT/UPDATE/DELETE policies are added here.
-- Reward writes should go through public.award_reward_event(), which derives
-- user_id from auth.uid() and performs event insert + XP increment atomically.

create index if not exists idx_reward_events_user_id
  on public.reward_events(user_id);

create index if not exists idx_reward_events_event_type
  on public.reward_events(event_type);

create index if not exists idx_reward_events_status
  on public.reward_events(status);

create index if not exists idx_reward_events_created_at
  on public.reward_events(created_at desc);

create index if not exists idx_reward_events_user_created_at
  on public.reward_events(user_id, created_at desc);
