alter table public.ideas
  add column if not exists script_rows jsonb not null default '[]'::jsonb;
