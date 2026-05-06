-- Phase 2026-05-06: protect admin-controlled profile fields.
--
-- Regular authenticated users may still update their own editable profile
-- columns through the existing self-profile policy, but they must not be able
-- to flip either platform-control flag through direct browser client updates.

create or replace function public.guard_profile_admin_changes()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    -- Allow if explicitly sanctioned by set_user_admin().
    if coalesce(current_setting('app.bypass_admin_guard', true), 'false') = 'true' then
      return new;
    end if;
    -- Allow superuser / migrations / bootstrap SQL.
    if current_user in ('postgres', 'supabase_admin') then
      return new;
    end if;
    raise exception 'is_admin can only be changed via public.set_user_admin()';
  end if;

  if new.is_disabled is distinct from old.is_disabled then
    -- Allow superuser / migrations / bootstrap SQL.
    if current_user in ('postgres', 'supabase_admin') then
      return new;
    end if;
    if not public.is_admin() then
      raise exception 'is_disabled can only be changed by an admin';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_admin_changes on public.profiles;
create trigger trg_guard_profile_admin_changes
  before update of is_admin, is_disabled on public.profiles
  for each row execute function public.guard_profile_admin_changes();
