-- Public profiles expose aggregate portfolio stats through
-- public.public_profiles. Raw learner-owned rows stay private.

create or replace view public.public_profiles
with (security_invoker = false) as
select
  p.id                    as id,
  p.display_name          as display_name,
  p.avatar_url            as avatar_url,
  p.public_handle         as handle,
  coalesce(x.total, 0)    as xp_total,
  coalesce(s.days, 0)     as streak_days,
  coalesce(lesson_counts.n, 0) as lessons_completed,
  coalesce(badge_counts.n, 0)  as badges_earned
from public.profiles p
left join public.xp x on x.user_id = p.id
left join public.streaks s on s.user_id = p.id
left join (
  select user_id, count(*)::int as n
  from public.progress
  group by user_id
) lesson_counts on lesson_counts.user_id = p.id
left join (
  select user_id, count(*)::int as n
  from public.badges
  group by user_id
) badge_counts on badge_counts.user_id = p.id
where p.is_public = true
  and coalesce(p.is_disabled, false) = false;

grant select on public.public_profiles to anon, authenticated;

drop policy if exists "Public profiles readable by anyone" on public.profiles;
drop policy if exists "Public xp readable" on public.xp;
drop policy if exists "Public streaks readable" on public.streaks;
drop policy if exists "Public progress count readable" on public.progress;
drop policy if exists "Public badges count readable" on public.badges;

revoke select on table public.profiles from anon;
revoke select on table public.xp from anon;
revoke select on table public.streaks from anon;
revoke select on table public.progress from anon;
revoke select on table public.badges from anon;

