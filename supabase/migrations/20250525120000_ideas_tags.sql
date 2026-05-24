-- Phase 4: теги для идей
alter table public.ideas
  add column if not exists tags text[] not null default '{}';
