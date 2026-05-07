-- Harden profile updates so learner-controlled clients can only edit
-- harmless presentation fields. Admin/security fields are guarded by
-- triggers and changed only through audited SECURITY DEFINER RPCs.

-- Replace the broad "manage own profiles" policy with explicit CRUD
-- policies. RLS still controls which rows a user may touch; column
-- privileges below control which fields a browser client may update.
drop policy if exists "Users manage own profiles" on public.profiles;

drop policy if exists "Users read own profiles" on public.profiles;
create policy "Users read own profiles"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users insert own profiles" on public.profiles;
create policy "Users insert own profiles"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users update own safe profile fields" on public.profiles;
create policy "Users update own safe profile fields"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Column-level grants are the main safe-field allowlist for browser
-- updates. Presentation fields are user-editable; role/account-status
-- and audit/security fields are intentionally excluded.
revoke insert, update on table public.profiles from authenticated;
grant insert (id, display_name, avatar_url, is_public, public_handle)
  on table public.profiles to authenticated;
grant update (display_name, avatar_url, is_public, public_handle)
  on table public.profiles to authenticated;

-- Keep normal profile reads available to authenticated clients.
grant select on table public.profiles to authenticated;

-- Direct account-status edits are blocked even if a future grant/policy
-- accidentally widens update access. Admin disabling must go through
-- public.set_user_disabled(), which sets a transaction-local bypass and
-- writes an audit row.
create or replace function public.guard_profile_disabled_changes()
returns trigger
language plpgsql
as $$
begin
  if new.is_disabled is distinct from old.is_disabled then
    if coalesce(current_setting('app.bypass_disabled_guard', true), 'false') = 'true' then
      return new;
    end if;

    if current_user in ('postgres', 'supabase_admin') then
      return new;
    end if;

    raise exception 'is_disabled can only be changed via public.set_user_disabled()';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_disabled_changes on public.profiles;
create trigger trg_guard_profile_disabled_changes
  before update of is_disabled on public.profiles
  for each row execute function public.guard_profile_disabled_changes();

create or replace function public.set_user_disabled(
  target_user_id uuid,
  make_disabled boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_admin() then
    raise exception 'Admin privileges required';
  end if;

  if v_caller = target_user_id then
    raise exception 'Admins cannot change their own account status';
  end if;

  perform set_config('app.bypass_disabled_guard', 'true', true);
  update public.profiles
    set is_disabled = make_disabled
    where id = target_user_id;
  perform set_config('app.bypass_disabled_guard', 'false', true);

  insert into public.admin_audit_log (actor_id, target_id, action, details)
  values (
    v_caller,
    target_user_id,
    case when make_disabled then 'disable_user' else 'enable_user' end,
    jsonb_build_object('is_disabled', make_disabled)
  );
end;
$$;

revoke all on function public.set_user_disabled(uuid, boolean) from public;
grant execute on function public.set_user_disabled(uuid, boolean) to authenticated;
