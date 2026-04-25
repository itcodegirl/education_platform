-- Phase 16: atomic reward award RPC.
-- This function is the only intended browser-callable write path for backend
-- reward events. It derives identity from auth.uid() and never accepts user_id
-- from the client.

create or replace function public.award_reward_event(
  p_event_key text,
  p_event_type text,
  p_entity_id text,
  p_xp_amount integer,
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
  v_event_key text := nullif(trim(coalesce(p_event_key, '')), '');
  v_entity_id text := nullif(trim(coalesce(p_entity_id, '')), '');
  v_source text := nullif(trim(coalesce(p_source, 'client')), '');
begin
  if v_user_id is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'not_authenticated',
      'event_key', v_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if v_event_key is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'missing_event_key',
      'event_key', null,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if p_event_type not in (
    'LESSON_COMPLETE',
    'QUIZ_BASE',
    'QUIZ_PERFECT',
    'CHALLENGE_COMPLETE'
  ) then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'unsupported_event_type',
      'event_key', v_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if v_entity_id is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'missing_entity_id',
      'event_key', v_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if p_xp_amount is null or p_xp_amount <= 0 then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'invalid_xp_amount',
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
    p_event_type,
    v_entity_id,
    p_xp_amount,
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
  values (v_user_id, p_xp_amount, now())
  on conflict (user_id)
  do update set
    total = coalesce(public.xp.total, 0) + excluded.total,
    updated_at = now()
  returning total into v_total_xp;

  return jsonb_build_object(
    'status', 'awarded',
    'event_key', v_event_key,
    'xp_awarded', p_xp_amount,
    'total_xp', coalesce(v_total_xp, p_xp_amount)
  );
exception
  when others then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'database_error',
      'event_key', v_event_key,
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
