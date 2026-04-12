-- ═══════════════════════════════════════════════
-- CODEHERWAY SUPABASE SCHEMA
-- Run this in Supabase SQL Editor (one time)
-- ═══════════════════════════════════════════════

-- 1. User Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Progress — completed lessons + quiz scores
create table if not exists public.progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  lesson_key text not null,
  completed_at timestamptz default now(),
  unique(user_id, lesson_key)
);

create table if not exists public.quiz_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  quiz_key text not null,
  score text not null,
  completed_at timestamptz default now(),
  unique(user_id, quiz_key)
);

-- 3. XP
create table if not exists public.xp (
  user_id uuid references auth.users on delete cascade primary key,
  total integer default 0,
  updated_at timestamptz default now()
);

-- 4. Streaks
create table if not exists public.streaks (
  user_id uuid references auth.users on delete cascade primary key,
  days integer default 0,
  last_date date,
  updated_at timestamptz default now()
);

-- 5. Daily Goals
create table if not exists public.daily_goals (
  user_id uuid references auth.users on delete cascade primary key,
  goal_date date default current_date,
  count integer default 0,
  updated_at timestamptz default now()
);

-- 6. Earned Badges
create table if not exists public.badges (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  badge_id text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

-- 7. Spaced Repetition Queue
create table if not exists public.sr_cards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  question text not null,
  code text,
  options jsonb not null,
  correct integer not null,
  explanation text not null,
  source text not null,
  added_at timestamptz default now(),
  next_review timestamptz default now(),
  interval_days integer default 1,
  ease real default 2.5,
  unique(user_id, question)
);

-- 8. Bookmarks (NEW)
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  lesson_key text not null,
  course_id text not null,
  lesson_title text not null,
  created_at timestamptz default now(),
  unique(user_id, lesson_key)
);

-- 9. Notes (NEW)
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  lesson_key text not null,
  content text not null,
  updated_at timestamptz default now(),
  unique(user_id, lesson_key)
);

-- 10. Courses Visited (for Explorer badge)
create table if not exists public.courses_visited (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_id text not null,
  visited_at timestamptz default now(),
  unique(user_id, course_id)
);

-- 11. Last Position (resume where you left off)
create table if not exists public.last_position (
  user_id uuid references auth.users on delete cascade primary key,
  course text,
  mod text,
  les text,
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════
-- ROW LEVEL SECURITY — users can only see their own data
-- ═══════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.quiz_scores enable row level security;
alter table public.xp enable row level security;
alter table public.streaks enable row level security;
alter table public.daily_goals enable row level security;
alter table public.badges enable row level security;
alter table public.sr_cards enable row level security;
alter table public.bookmarks enable row level security;
alter table public.notes enable row level security;
alter table public.courses_visited enable row level security;
alter table public.last_position enable row level security;

-- Policy: users can CRUD their own rows
create policy "Users manage own profiles" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own progress" on public.progress for all using (auth.uid() = user_id);
create policy "Users manage own quiz_scores" on public.quiz_scores for all using (auth.uid() = user_id);
create policy "Users manage own xp" on public.xp for all using (auth.uid() = user_id);
create policy "Users manage own streaks" on public.streaks for all using (auth.uid() = user_id);
create policy "Users manage own daily_goals" on public.daily_goals for all using (auth.uid() = user_id);
create policy "Users manage own badges" on public.badges for all using (auth.uid() = user_id);
create policy "Users manage own sr_cards" on public.sr_cards for all using (auth.uid() = user_id);
create policy "Users manage own bookmarks" on public.bookmarks for all using (auth.uid() = user_id);
create policy "Users manage own notes" on public.notes for all using (auth.uid() = user_id);
create policy "Users manage own courses_visited" on public.courses_visited for all using (auth.uid() = user_id);
create policy "Users manage own last_position" on public.last_position for all using (auth.uid() = user_id);

-- Auto-create profile + XP + streak rows on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name) values (new.id, new.raw_user_meta_data->>'display_name');
  insert into public.xp (user_id) values (new.id);
  insert into public.streaks (user_id) values (new.id);
  insert into public.daily_goals (user_id) values (new.id);
  insert into public.last_position (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indexes for performance
create index if not exists idx_progress_user on public.progress(user_id);
create index if not exists idx_quiz_scores_user on public.quiz_scores(user_id);
create index if not exists idx_badges_user on public.badges(user_id);
create index if not exists idx_sr_cards_user_review on public.sr_cards(user_id, next_review);
create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_notes_user on public.notes(user_id);

-- ═══════════════════════════════════════════════
-- ADMIN SUPPORT
-- ═══════════════════════════════════════════════

-- Add is_admin flag to profiles
alter table public.profiles add column if not exists is_admin boolean default false;

-- Admin can read all user data (RLS policies)
-- Run this AFTER setting your account's is_admin = true

create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
end;
$$ language plpgsql security definer;

-- Admin read policies (admins can SELECT all rows)
create policy "Admins read all profiles" on public.profiles for select using (is_admin());
create policy "Admins read all progress" on public.progress for select using (is_admin());
create policy "Admins read all quiz_scores" on public.quiz_scores for select using (is_admin());
create policy "Admins read all xp" on public.xp for select using (is_admin());
create policy "Admins read all streaks" on public.streaks for select using (is_admin());
create policy "Admins read all badges" on public.badges for select using (is_admin());

-- To make yourself admin, run in Supabase SQL Editor:
-- UPDATE public.profiles SET is_admin = true WHERE id = 'YOUR-USER-UUID-HERE';

-- Add is_disabled flag to profiles
alter table public.profiles add column if not exists is_disabled boolean default false;

-- Admins can update profiles (to disable/enable users)
create policy "Admins update all profiles" on public.profiles for update using (is_admin());

-- ═══════════════════════════════════════════════
-- AI RATE LIMITING
-- Persistent per-user request counters for the Netlify AI proxy.
-- Written exclusively by netlify/functions/ai.js using the service-role key,
-- so RLS stays enabled and denies all client access.
-- ═══════════════════════════════════════════════

create table if not exists public.ai_rate_limits (
  user_id uuid references auth.users on delete cascade primary key,
  window_start timestamptz not null default now(),
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.ai_rate_limits enable row level security;
-- No policies — only the service-role key (used by the Netlify function)
-- can read/write this table. Clients cannot see or tamper with it.

create index if not exists idx_ai_rate_limits_window
  on public.ai_rate_limits(window_start);
