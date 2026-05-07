-- Add stable resume identifiers while preserving the legacy label
-- fields (`course`, `mod`, `les`) for existing saved positions.

alter table public.last_position
  add column if not exists course_id text,
  add column if not exists module_id text,
  add column if not exists lesson_id text,
  add column if not exists is_module_quiz boolean default false;

