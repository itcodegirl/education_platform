-- Keep admin rollup data behind a database-enforced admin boundary.
-- The view is still selectable by authenticated clients so existing admin UI
-- code can use Supabase query helpers, but non-admin callers receive no rows.

alter table public.profiles add column if not exists is_disabled boolean default false;

create or replace view public.admin_user_rollups
with (security_invoker = true)
as
select
  p.id,
  p.display_name,
  p.is_admin,
  p.is_disabled,
  p.created_at,
  coalesce(progress_counts.lessons_done, 0)::int as lessons_done,
  coalesce(x.total, 0)::int as xp_total,
  coalesce(s.days, 0)::int as streak_days,
  coalesce(badge_counts.badges_earned, 0)::int as badges_earned
from public.profiles p
left join (
  select user_id, count(*)::int as lessons_done
  from public.progress
  group by user_id
) progress_counts on progress_counts.user_id = p.id
left join public.xp x on x.user_id = p.id
left join public.streaks s on s.user_id = p.id
left join (
  select user_id, count(*)::int as badges_earned
  from public.badges
  group by user_id
) badge_counts on badge_counts.user_id = p.id
where public.is_admin();

grant select on public.admin_user_rollups to authenticated;
