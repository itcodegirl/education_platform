-- Phase 21: harden reward award trust boundaries.
--
-- The first reward RPC migration made awards atomic and auth-owned, but it
-- still accepted browser-supplied event keys and XP amounts. This migration
-- keeps the same callable RPC surface for compatibility while moving canonical
-- reward key and XP decisions into the database.

create table if not exists public.reward_catalog (
  event_type text not null,
  entity_id text not null default '*',
  event_key_prefix text not null,
  xp_amount integer not null check (xp_amount > 0),
  entity_id_pattern text not null default '^[A-Za-z0-9][A-Za-z0-9:_-]{0,159}$',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_type, entity_id),
  constraint reward_catalog_event_type_check check (
    event_type in (
      'LESSON_COMPLETE',
      'QUIZ_BASE',
      'QUIZ_PERFECT',
      'CHALLENGE_COMPLETE'
    )
  )
);

alter table public.reward_catalog enable row level security;

drop policy if exists "Reward catalog readable by authenticated users"
  on public.reward_catalog;

create policy "Reward catalog readable by authenticated users"
  on public.reward_catalog
  for select
  to authenticated
  using (is_active = true);

revoke all on table public.reward_catalog from anon, authenticated;
grant select on table public.reward_catalog to authenticated;

insert into public.reward_catalog (
  event_type,
  entity_id,
  event_key_prefix,
  xp_amount,
  entity_id_pattern
)
values
  (
    'LESSON_COMPLETE',
    '*',
    'lesson-complete',
    25,
    '^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$'
  ),
  (
    'QUIZ_BASE',
    '*',
    'quiz-base',
    40,
    '^[A-Za-z0-9][A-Za-z0-9:_-]{0,159}$'
  ),
  (
    'QUIZ_PERFECT',
    '*',
    'quiz-perfect',
    60,
    '^[A-Za-z0-9][A-Za-z0-9:_-]{0,159}$'
  ),
  (
    'CHALLENGE_COMPLETE',
    '*',
    'challenge-complete',
    25,
    '^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$'
  )
on conflict (event_type, entity_id)
do update set
  event_key_prefix = excluded.event_key_prefix,
  xp_amount = excluded.xp_amount,
  entity_id_pattern = excluded.entity_id_pattern,
  is_active = true,
  updated_at = now();

create or replace function public.award_reward_event(
  p_event_key text default null,
  p_event_type text default null,
  p_entity_id text default null,
  p_xp_amount integer default null,
  p_metadata jsonb default '{}'::jsonb,
  p_source text default 'client'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event_id uuid;
  v_total_xp integer;
  v_requested_event_key text := nullif(trim(coalesce(p_event_key, '')), '');
  v_event_type text := nullif(trim(coalesce(p_event_type, '')), '');
  v_entity_id text := nullif(trim(coalesce(p_entity_id, '')), '');
  v_source text := nullif(trim(coalesce(p_source, 'client')), '');
  v_catalog record;
  v_event_key text;
begin
  if v_user_id is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'not_authenticated',
      'event_key', v_requested_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if v_event_type is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'missing_event_type',
      'event_key', v_requested_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if v_entity_id is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'missing_entity_id',
      'event_key', v_requested_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  select *
    into v_catalog
    from public.reward_catalog
    where event_type = v_event_type
      and entity_id in (v_entity_id, '*')
      and is_active = true
    order by case when entity_id = v_entity_id then 0 else 1 end
    limit 1;

  if v_catalog.event_type is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'unknown_reward_entity',
      'event_key', v_requested_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if v_entity_id !~ v_catalog.entity_id_pattern then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'invalid_entity_id',
      'event_key', v_requested_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  v_event_key := concat(v_catalog.event_key_prefix, ':', v_entity_id, ':', v_user_id::text);

  if v_requested_event_key is not null and v_requested_event_key <> v_event_key then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'event_key_mismatch',
      'event_key', v_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if p_xp_amount is not null and p_xp_amount <> v_catalog.xp_amount then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'xp_amount_mismatch',
      'event_key', v_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  insert into public.reward_events (
    user_id,
    event_key,
    event_type,
    entity_id,
    xp_amount,
    metadata,
    status,
    source,
    processed_at,
    updated_at
  )
  values (
    v_user_id,
    v_event_key,
    v_catalog.event_type,
    v_entity_id,
    v_catalog.xp_amount,
    coalesce(p_metadata, '{}'::jsonb),
    'processed',
    coalesce(v_source, 'client'),
    now(),
    now()
  )
  on conflict (user_id, event_key) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    select coalesce(total, 0)
      into v_total_xp
      from public.xp
      where user_id = v_user_id;

    return jsonb_build_object(
      'status', 'skipped',
      'event_key', v_event_key,
      'xp_awarded', 0,
      'total_xp', coalesce(v_total_xp, 0)
    );
  end if;

  insert into public.xp (user_id, total, updated_at)
  values (v_user_id, v_catalog.xp_amount, now())
  on conflict (user_id)
  do update set
    total = coalesce(public.xp.total, 0) + excluded.total,
    updated_at = now()
  returning total into v_total_xp;

  return jsonb_build_object(
    'status', 'awarded',
    'event_key', v_event_key,
    'xp_awarded', v_catalog.xp_amount,
    'total_xp', coalesce(v_total_xp, v_catalog.xp_amount)
  );
exception
  when others then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'database_error',
      'event_key', coalesce(v_event_key, v_requested_event_key),
      'xp_awarded', 0,
      'total_xp', null,
      'message', sqlerrm
    );
end;
$$;

revoke all on function public.award_reward_event(
  text,
  text,
  text,
  integer,
  jsonb,
  text
) from public;

grant execute on function public.award_reward_event(
  text,
  text,
  text,
  integer,
  jsonb,
  text
) to authenticated;
