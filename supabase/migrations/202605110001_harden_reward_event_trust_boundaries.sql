-- Harden reward awards so browser clients cannot mint arbitrary XP or invent
-- rewardable entities. The RPC keeps the existing signature for compatibility,
-- but derives the event key and XP amount from server-owned catalog data.

create table if not exists public.reward_catalog (
  event_type text not null check (
    event_type in (
      'LESSON_COMPLETE',
      'QUIZ_BASE',
      'QUIZ_PERFECT',
      'CHALLENGE_COMPLETE'
    )
  ),
  entity_id text not null check (char_length(entity_id) <= 160),
  xp_amount integer not null check (xp_amount > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_type, entity_id)
);

alter table public.reward_catalog enable row level security;

drop policy if exists "Authenticated users read active reward catalog" on public.reward_catalog;
create policy "Authenticated users read active reward catalog"
  on public.reward_catalog
  for select
  using (is_active = true);

grant select on table public.reward_catalog to authenticated;
revoke insert, update, delete on table public.reward_catalog from anon, authenticated;

with lesson_entities(entity_id) as (
  select entity_id from unnest(array[
    'c:html|m:103|l:lesson-04',
    'c:html|m:103|l:lesson-06',
    'c:html|m:103|l:lesson-05',
    'c:html|m:103|l:lesson-09',
    'c:html|m:104|l:lesson-07',
    'c:html|m:104|l:lesson-12',
    'c:html|m:101|l:lesson-01',
    'c:html|m:101|l:lesson-02',
    'c:html|m:101|l:lesson-03',
    'c:html|m:101|l:lesson-08',
    'c:html|m:102|l:lesson-10',
    'c:html|m:102|l:lesson-11',
    'c:css|m:204|l:css-4-1',
    'c:css|m:204|l:css-4-2',
    'c:css|m:204|l:css-4-3',
    'c:css|m:204|l:css-4-4',
    'c:css|m:204|l:css-4-5',
    'c:css|m:204|l:css-4-6',
    'c:css|m:201|l:css-1-1',
    'c:css|m:201|l:css-1-2',
    'c:css|m:201|l:css-1-3',
    'c:css|m:201|l:css-1-4',
    'c:css|m:201|l:css-1-5',
    'c:css|m:201|l:css-1-6',
    'c:css|m:202|l:css-2-1',
    'c:css|m:202|l:css-2-2',
    'c:css|m:202|l:css-2-3',
    'c:css|m:202|l:css-2-4',
    'c:css|m:202|l:css-2-5',
    'c:css|m:202|l:css-2-6',
    'c:css|m:203|l:css-3-1',
    'c:css|m:203|l:css-3-2',
    'c:css|m:203|l:css-3-3',
    'c:css|m:203|l:css-3-4',
    'c:css|m:203|l:css-3-5',
    'c:css|m:203|l:css-3-6',
    'c:js|m:304|l:js-4-1',
    'c:js|m:304|l:js-4-2',
    'c:js|m:304|l:js-4-3',
    'c:js|m:304|l:js-4-4',
    'c:js|m:305|l:js-5-1',
    'c:js|m:305|l:js-5-2',
    'c:js|m:305|l:js-5-3',
    'c:js|m:305|l:js-5-4',
    'c:js|m:302|l:js-2-1',
    'c:js|m:302|l:js-2-2',
    'c:js|m:302|l:js-2-3',
    'c:js|m:302|l:js-2-4',
    'c:js|m:306|l:js-6-1',
    'c:js|m:306|l:js-6-2',
    'c:js|m:306|l:js-6-3',
    'c:js|m:306|l:js-6-4',
    'c:js|m:301|l:js-1-1',
    'c:js|m:301|l:js-1-2',
    'c:js|m:301|l:js-1-3',
    'c:js|m:301|l:js-1-4',
    'c:js|m:303|l:js-3-1',
    'c:js|m:303|l:js-3-2',
    'c:js|m:303|l:js-3-3',
    'c:react|m:301|l:r1-1',
    'c:react|m:301|l:r1-2',
    'c:react|m:301|l:r1-3',
    'c:react|m:301|l:r1-4',
    'c:react|m:301|l:r1-5',
    'c:react|m:302|l:r2-1',
    'c:react|m:302|l:r2-2',
    'c:react|m:302|l:r2-3',
    'c:react|m:302|l:r2-4',
    'c:react|m:302|l:r2-5',
    'c:react|m:302|l:r2-6',
    'c:react|m:302|l:r2-7',
    'c:react|m:309|l:r9-1',
    'c:react|m:309|l:r9-2',
    'c:react|m:309|l:r9-3',
    'c:react|m:315|l:r15-1',
    'c:react|m:315|l:r15-2',
    'c:react|m:315|l:r15-3',
    'c:react|m:316|l:r16-1',
    'c:react|m:316|l:r16-2',
    'c:react|m:316|l:r16-3',
    'c:react|m:313|l:r13-1',
    'c:react|m:313|l:r13-2',
    'c:react|m:308|l:r8-1',
    'c:react|m:308|l:r8-2',
    'c:react|m:308|l:r8-3',
    'c:react|m:319|l:r19-1',
    'c:react|m:319|l:r19-2',
    'c:react|m:319|l:r19-3',
    'c:react|m:319|l:r19-4',
    'c:react|m:319|l:r19-5',
    'c:react|m:319|l:r19-6',
    'c:react|m:319|l:r19-7',
    'c:react|m:319|l:r19-8',
    'c:react|m:319|l:r19-9',
    'c:react|m:320|l:r20-1',
    'c:react|m:320|l:r20-2',
    'c:react|m:320|l:r20-3',
    'c:react|m:323|l:r23-1',
    'c:react|m:323|l:r23-2',
    'c:react|m:323|l:r23-3'
  ]::text[]) as ids(entity_id)
),
quiz_entities(entity_id) as (
  select entity_id from unnest(array[
    'l:html:lesson-01',
    'l:html:lesson-02',
    'l:html:lesson-03',
    'l:html:lesson-04',
    'l:html:lesson-05',
    'l:html:lesson-06',
    'l:html:lesson-07',
    'l:html:lesson-08',
    'l:html:lesson-09',
    'l:html:lesson-10',
    'l:html:lesson-11',
    'l:html:lesson-12',
    'l:css:css-1-1',
    'l:css:css-1-2',
    'l:css:css-1-3',
    'l:css:css-1-4',
    'l:css:css-1-5',
    'l:css:css-1-6',
    'l:css:css-2-1',
    'l:css:css-2-2',
    'l:css:css-2-3',
    'l:css:css-2-4',
    'l:css:css-2-5',
    'l:css:css-2-6',
    'l:css:css-3-1',
    'l:css:css-3-2',
    'l:css:css-3-3',
    'l:css:css-3-4',
    'l:css:css-3-5',
    'l:css:css-3-6',
    'l:css:css-4-1',
    'l:css:css-4-2',
    'l:css:css-4-3',
    'l:css:css-4-4',
    'l:css:css-4-5',
    'l:css:css-4-6',
    'l:js:js-1-1',
    'l:js:js-1-2',
    'l:js:js-1-3',
    'l:js:js-1-4',
    'l:js:js-2-1',
    'l:js:js-2-2',
    'l:js:js-2-3',
    'l:js:js-2-4',
    'l:js:js-3-1',
    'l:js:js-3-2',
    'l:js:js-3-3',
    'l:js:js-4-1',
    'l:js:js-4-2',
    'l:js:js-4-3',
    'l:js:js-4-4',
    'l:js:js-5-1',
    'l:js:js-5-2',
    'l:js:js-5-3',
    'l:js:js-5-4',
    'l:js:js-6-1',
    'l:js:js-6-2',
    'l:js:js-6-3',
    'l:js:js-6-4',
    'l:react:r1-1',
    'l:react:r1-2',
    'l:react:r1-3',
    'l:react:r1-4',
    'l:react:r1-5',
    'l:react:r13-1',
    'l:react:r13-2',
    'l:react:r15-1',
    'l:react:r15-2',
    'l:react:r15-3',
    'l:react:r16-1',
    'l:react:r16-2',
    'l:react:r16-3',
    'l:react:r19-1',
    'l:react:r19-2',
    'l:react:r19-3',
    'l:react:r19-4',
    'l:react:r19-5',
    'l:react:r19-6',
    'l:react:r19-7',
    'l:react:r19-8',
    'l:react:r19-9',
    'l:react:r2-1',
    'l:react:r2-2',
    'l:react:r2-3',
    'l:react:r2-4',
    'l:react:r2-5',
    'l:react:r2-6',
    'l:react:r2-7',
    'l:react:r20-1',
    'l:react:r20-2',
    'l:react:r20-3',
    'l:react:r23-1',
    'l:react:r23-2',
    'l:react:r23-3',
    'l:react:r8-1',
    'l:react:r8-2',
    'l:react:r8-3',
    'l:react:r9-1',
    'l:react:r9-2',
    'l:react:r9-3'
  ]::text[]) as ids(entity_id)
),
challenge_entities(entity_id) as (
  select entity_id from unnest(array[
    'html-ch-1',
    'html-ch-10',
    'html-ch-2',
    'html-ch-3',
    'html-ch-4',
    'html-ch-5',
    'html-ch-6',
    'html-ch-7',
    'html-ch-8',
    'html-ch-9',
    'css-ch-1',
    'css-ch-10',
    'css-ch-2',
    'css-ch-3',
    'css-ch-4',
    'css-ch-5',
    'css-ch-6',
    'css-ch-7',
    'css-ch-8',
    'css-ch-9',
    'js-ch-1',
    'js-ch-10',
    'js-ch-2',
    'js-ch-3',
    'js-ch-4',
    'js-ch-5',
    'js-ch-6',
    'js-ch-7',
    'js-ch-8',
    'js-ch-9',
    'react-ch-1',
    'react-ch-10',
    'react-ch-2',
    'react-ch-3',
    'react-ch-4',
    'react-ch-5',
    'react-ch-6',
    'react-ch-7',
    'react-ch-8',
    'react-ch-9'
  ]::text[]) as ids(entity_id)
),
seed(event_type, entity_id, xp_amount) as (
  select 'LESSON_COMPLETE', entity_id, 25 from lesson_entities
  union all
  select 'QUIZ_BASE', entity_id, 40 from quiz_entities
  union all
  select 'QUIZ_PERFECT', entity_id, 60 from quiz_entities
  union all
  select 'CHALLENGE_COMPLETE', entity_id, 25 from challenge_entities
)
insert into public.reward_catalog (event_type, entity_id, xp_amount, is_active, updated_at)
select event_type, entity_id, xp_amount, true, now()
from seed
on conflict (event_type, entity_id)
do update set
  xp_amount = excluded.xp_amount,
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
  v_event_type text := nullif(trim(coalesce(p_event_type, '')), '');
  v_entity_id text := nullif(trim(coalesce(p_entity_id, '')), '');
  v_supplied_event_key text := nullif(trim(coalesce(p_event_key, '')), '');
  v_event_key text;
  v_expected_event_key text;
  v_expected_xp integer;
  v_source text := nullif(trim(coalesce(p_source, 'client')), '');
begin
  if v_user_id is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'not_authenticated',
      'event_key', null,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if v_event_type is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'missing_event_type',
      'event_key', v_supplied_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if v_entity_id is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'missing_entity_id',
      'event_key', v_supplied_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  select catalog.xp_amount
    into v_expected_xp
    from public.reward_catalog catalog
    where catalog.event_type = v_event_type
      and catalog.entity_id = v_entity_id
      and catalog.is_active = true;

  if v_expected_xp is null then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'unknown_reward_entity',
      'event_key', v_supplied_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  v_expected_event_key :=
    case v_event_type
      when 'LESSON_COMPLETE' then 'lesson-complete'
      when 'QUIZ_BASE' then 'quiz-base'
      when 'QUIZ_PERFECT' then 'quiz-perfect'
      when 'CHALLENGE_COMPLETE' then 'challenge-complete'
    end || ':' || v_entity_id || ':' || v_user_id::text;

  v_event_key := coalesce(v_supplied_event_key, v_expected_event_key);

  if v_event_key <> v_expected_event_key then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'event_key_mismatch',
      'event_key', v_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if p_xp_amount is not null and p_xp_amount <> v_expected_xp then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'xp_amount_mismatch',
      'event_key', v_event_key,
      'xp_awarded', 0,
      'total_xp', null
    );
  end if;

  if v_source is null then
    v_source := 'client';
  end if;

  if char_length(v_source) > 80 then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'invalid_source',
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
    v_event_type,
    v_entity_id,
    v_expected_xp,
    coalesce(p_metadata, '{}'::jsonb),
    'processed',
    v_source,
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
  values (v_user_id, v_expected_xp, now())
  on conflict (user_id)
  do update set
    total = coalesce(public.xp.total, 0) + excluded.total,
    updated_at = now()
  returning total into v_total_xp;

  return jsonb_build_object(
    'status', 'awarded',
    'event_key', v_event_key,
    'xp_awarded', v_expected_xp,
    'total_xp', coalesce(v_total_xp, v_expected_xp)
  );
exception
  when others then
    return jsonb_build_object(
      'status', 'failed',
      'reason', 'database_error',
      'event_key', coalesce(v_event_key, v_supplied_event_key),
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
