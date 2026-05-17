-- Searchable admin audit log reader for the Admin Dashboard.
-- Keeps full-table search on the database side while preserving the
-- admin-only audit-log boundary.

create or replace function public.search_admin_audit_log(
  p_action text default null,
  p_since timestamptz default null,
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
  v_search text;
  v_like text;
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if not public.is_admin() then
    raise exception 'Admin privileges required';
  end if;

  v_search := nullif(trim(coalesce(p_search, '')), '');
  v_like := case when v_search is null then null else '%' || v_search || '%' end;

  with filtered as (
    select
      audit.id,
      audit.actor_id,
      audit.target_id,
      audit.action,
      audit.details,
      audit.created_at,
      coalesce(actor.display_name, '') as actor_name,
      coalesce(target.display_name, '') as target_name
    from public.admin_audit_log audit
    left join public.profiles actor on actor.id = audit.actor_id
    left join public.profiles target on target.id = audit.target_id
    where (
      nullif(p_action, '') is null
      or p_action = 'all'
      or audit.action = p_action
    )
    and (p_since is null or audit.created_at >= p_since)
    and (
      v_search is null
      or audit.action ilike v_like
      or audit.actor_id::text ilike v_like
      or audit.target_id::text ilike v_like
      or coalesce(actor.display_name, '') ilike v_like
      or coalesce(target.display_name, '') ilike v_like
      or coalesce(audit.details::text, '') ilike v_like
    )
  ),
  total as (
    select count(*)::int as value from filtered
  ),
  page_rows as (
    select *
    from filtered
    order by created_at desc
    limit v_limit
    offset v_offset
  )
  select jsonb_build_object(
    'total', total.value,
    'rows', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', page_rows.id,
          'actor_id', page_rows.actor_id,
          'target_id', page_rows.target_id,
          'action', page_rows.action,
          'details', page_rows.details,
          'created_at', page_rows.created_at,
          'actorName', page_rows.actor_name,
          'targetName', page_rows.target_name
        )
        order by page_rows.created_at desc
      ) filter (where page_rows.id is not null),
      '[]'::jsonb
    )
  )
  into v_payload
  from total
  left join page_rows on true
  group by total.value;

  return coalesce(v_payload, jsonb_build_object('total', 0, 'rows', '[]'::jsonb));
end;
$$;

revoke all on function public.search_admin_audit_log(text, timestamptz, text, integer, integer) from public;
grant execute on function public.search_admin_audit_log(text, timestamptz, text, integer, integer) to authenticated;
