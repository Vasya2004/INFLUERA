create table if not exists public.creator_references (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  handle text,
  platform text,
  url text,
  type text not null default 'другое',
  niche text,
  content_focus text,
  why_relevant text,
  notes text,
  tags text[] not null default '{}',
  rating integer not null default 3 check (rating between 1 and 5),
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists creator_references_user_created_idx
  on public.creator_references (user_id, created_at desc);

alter table public.creator_references enable row level security;

drop policy if exists "Users can read own creator references" on public.creator_references;
create policy "Users can read own creator references"
  on public.creator_references for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own creator references" on public.creator_references;
create policy "Users can insert own creator references"
  on public.creator_references for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own creator references" on public.creator_references;
create policy "Users can update own creator references"
  on public.creator_references for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own creator references" on public.creator_references;
create policy "Users can delete own creator references"
  on public.creator_references for delete
  using (auth.uid() = user_id);
