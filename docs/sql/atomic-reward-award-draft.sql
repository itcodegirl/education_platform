-- Draft only: atomic reward award operation for future Supabase migration.
-- This file is documentation/scaffolding and is not wired into production behavior.

create or replace function public.award_reward_event(
  p_event_key text,
  p_event_type text,
  p_entity_id text,
  p_xp_amount integer,
  p_metadata jsonb default '{}'::jsonb,
  p_source text default 'web'
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
begin
  if v_user_id is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'not_authenticated'
    );
  end if;

  if p_event_key is null or length(trim(p_event_key)) = 0 then
    return jsonb_build_object('status', 'failed', 'reason', 'missing_event_key');
  end if;

  if p_event_type not in (
    'LESSON_COMPLETE',
    'QUIZ_BASE',
    'QUIZ_PERFECT',
    'CHALLENGE_COMPLETE'
  ) then
    return jsonb_build_object('status', 'failed', 'reason', 'unsupported_event_type');
  end if;

  if p_entity_id is null or length(trim(p_entity_id)) = 0 then
    return jsonb_build_object('status', 'failed', 'reason', 'missing_entity_id');
  end if;

  if p_xp_amount is null or p_xp_amount < 0 then
    return jsonb_build_object('status', 'failed', 'reason', 'invalid_xp_amount');
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
    processed_at
  )
  values (
    v_user_id,
    trim(p_event_key),
    p_event_type,
    trim(p_entity_id),
    p_xp_amount,
    coalesce(p_metadata, '{}'::jsonb),
    'processed',
    coalesce(nullif(trim(p_source), ''), 'web'),
    now()
  )
  on conflict (user_id, event_key) do nothing
  returning id into v_event_id;

  if v_event_id is null then
    return jsonb_build_object(
      'status', 'skipped',
      'event_key', trim(p_event_key),
      'xp_awarded', 0
    );
  end if;

  insert into public.xp (user_id, total, updated_at)
  values (v_user_id, p_xp_amount, now())
  on conflict (user_id)
  do update set
    total = public.xp.total + excluded.total,
    updated_at = now()
  returning total into v_total_xp;

  return jsonb_build_object(
    'status', 'awarded',
    'event_id', v_event_id,
    'event_key', trim(p_event_key),
    'xp_awarded', p_xp_amount,
    'total_xp', v_total_xp
  );
exception
  when others then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'database_error',
      'message', sqlerrm
    );
end;
$$;
