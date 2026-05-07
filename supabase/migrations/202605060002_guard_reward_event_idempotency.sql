-- Ensure reward event idempotency is enforced even if an environment created
-- public.reward_events before the table-level unique constraint existed.
--
-- This intentionally fails if duplicate (user_id, event_key) rows already
-- exist; resolve those rows before enabling backend reward sync.

create unique index if not exists reward_events_user_event_key_key
  on public.reward_events (user_id, event_key);
