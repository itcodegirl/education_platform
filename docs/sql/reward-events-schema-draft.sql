-- Draft only: reward event schema for future Supabase migration.
-- This file is documentation/scaffolding and is not wired into production behavior.

create table if not exists public.reward_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
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
  xp_amount integer not null default 0 check (xp_amount >= 0),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (
    status in ('pending', 'processed', 'skipped', 'failed', 'reconciled')
  ),
  source text not null default 'web' check (char_length(source) <= 80),
  client_event_id text check (char_length(client_event_id) <= 240),
  client_created_at timestamptz,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, event_key)
);

alter table public.reward_events enable row level security;

create policy "Users read own reward events"
  on public.reward_events
  for select
  using (auth.uid() = user_id);

-- Future write policy:
-- Prefer a security-definer RPC for inserts/updates so reward validation and XP writes
-- happen in one trusted transaction. Do not expose arbitrary client inserts once the
-- atomic award operation is active.

create index if not exists idx_reward_events_user_created
  on public.reward_events(user_id, created_at desc);

create index if not exists idx_reward_events_user_status
  on public.reward_events(user_id, status);

create index if not exists idx_reward_events_event_type
  on public.reward_events(event_type);
