-- Add the sanctioned admin role toggle RPC for existing projects that
-- already have the profile admin-field guard installed.

create or replace function public.set_user_admin(
  target_user_id uuid,
  make_admin boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_updated integer;
begin
  if v_caller is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_admin() then
    raise exception 'Admin privileges required';
  end if;

  if v_caller = target_user_id then
    raise exception 'Admins cannot change their own is_admin flag';
  end if;

  perform set_config('app.bypass_admin_guard', 'true', true);
  update public.profiles
    set is_admin = make_admin
    where id = target_user_id;
  get diagnostics v_updated = row_count;
  perform set_config('app.bypass_admin_guard', 'false', true);

  if v_updated = 0 then
    raise exception 'Target user profile not found';
  end if;

  insert into public.admin_audit_log (actor_id, target_id, action, details)
  values (
    v_caller,
    target_user_id,
    case when make_admin then 'grant_admin' else 'revoke_admin' end,
    jsonb_build_object('make_admin', make_admin)
  );
end;
$$;

revoke all on function public.set_user_admin(uuid, boolean) from public;
grant execute on function public.set_user_admin(uuid, boolean) to authenticated;
