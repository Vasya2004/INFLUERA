-- Influera: workspace data per authenticated user (full AppState as JSONB)

create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists user_workspaces_updated_at_idx
  on public.user_workspaces (updated_at desc);

alter table public.user_workspaces enable row level security;

drop policy if exists "workspace_select_own" on public.user_workspaces;
drop policy if exists "workspace_insert_own" on public.user_workspaces;
drop policy if exists "workspace_update_own" on public.user_workspaces;

create policy "workspace_select_own"
  on public.user_workspaces
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "workspace_insert_own"
  on public.user_workspaces
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "workspace_update_own"
  on public.user_workspaces
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_user_workspaces_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_workspaces_updated_at on public.user_workspaces;

create trigger user_workspaces_updated_at
  before update on public.user_workspaces
  for each row
  execute function public.set_user_workspaces_updated_at();
