create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text,
  reason text,
  status text not null default 'requested',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_deletion_requests_user_idx
  on public.account_deletion_requests (user_id, requested_at desc);

drop trigger if exists account_deletion_requests_updated_at on public.account_deletion_requests;
create trigger account_deletion_requests_updated_at
  before update on public.account_deletion_requests
  for each row execute function public.set_updated_at();

alter table public.account_deletion_requests enable row level security;

drop policy if exists "account_deletion_requests_own_select" on public.account_deletion_requests;
drop policy if exists "account_deletion_requests_own_insert" on public.account_deletion_requests;

create policy "account_deletion_requests_own_select"
  on public.account_deletion_requests for select to authenticated
  using (auth.uid() = user_id);

create policy "account_deletion_requests_own_insert"
  on public.account_deletion_requests for insert to authenticated
  with check (auth.uid() = user_id);

create or replace function public.request_account_deletion(deletion_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select email into current_email
  from auth.users
  where id = auth.uid();

  insert into public.account_deletion_requests (user_id, email, reason)
  values (auth.uid(), current_email, nullif(deletion_reason, ''));
end;
$$;

grant execute on function public.request_account_deletion(text) to authenticated;

