alter table public.ideas
  add column if not exists script text,
  add column if not exists storyboard text;

