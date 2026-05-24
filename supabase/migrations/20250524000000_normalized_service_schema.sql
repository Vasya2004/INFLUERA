-- Influera v1: normalized personal content-planner schema.
-- The legacy user_workspaces JSONB table remains as a migration/fallback source.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  niche text not null default '',
  positioning text not null default '',
  description text not null default '',
  target_audience text not null default '',
  main_topics text not null default '',
  rubrics text not null default '',
  tone text not null default '',
  expertise text not null default '',
  opportunities text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platforms (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  username text not null default '',
  url text not null default '',
  subscribers integer not null default 0 check (subscribers >= 0),
  target_subscribers integer not null default 0 check (target_subscribers >= 0),
  role text not null default 'дополнительная',
  weekly_plan integer not null default 0 check (weekly_plan >= 0),
  accent_color text,
  icon_storage_path text,
  icon_url text,
  mirror_platform_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, name, username)
);

create table if not exists public.platform_metrics (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  platform_id text not null,
  metric_date date not null,
  subscribers integer not null default 0 check (subscribers >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, platform_id, metric_date),
  foreign key (user_id, platform_id) references public.platforms (user_id, id) on delete cascade
);

create table if not exists public.goals (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type text not null,
  current_value numeric not null default 0,
  target_value numeric not null default 0,
  deadline timestamptz not null,
  platform_id text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, platform_id) references public.platforms (user_id, id) on delete restrict
);

create table if not exists public.ideas (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  format text not null,
  platform_id text,
  priority text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, platform_id) references public.platforms (user_id, id) on delete restrict
);

create table if not exists public.publications (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  publication_date timestamptz not null,
  format text not null,
  status text not null,
  idea_id text,
  note text,
  url text,
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, idea_id) references public.ideas (user_id, id) on delete restrict
);

create table if not exists public.publication_channels (
  publication_id text not null,
  platform_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, publication_id, platform_id),
  foreign key (user_id, publication_id) references public.publications (user_id, id) on delete cascade,
  foreign key (user_id, platform_id) references public.platforms (user_id, id) on delete cascade
);

create table if not exists public.checkpoints (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  checkpoint_date timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.templates (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  formats text[] not null default '{}',
  description text not null default '',
  usage text not null default '',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.template_files (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id text not null,
  original_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, template_id) references public.templates (user_id, id) on delete cascade
);

create table if not exists public.publication_files (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  publication_id text not null,
  original_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  created_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, publication_id) references public.publications (user_id, id) on delete cascade
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platforms_user_id_idx on public.platforms (user_id);
create index if not exists platform_metrics_user_platform_date_idx on public.platform_metrics (user_id, platform_id, metric_date desc);
create index if not exists goals_user_deadline_idx on public.goals (user_id, deadline);
create index if not exists goals_user_platform_idx on public.goals (user_id, platform_id);
create index if not exists ideas_user_status_idx on public.ideas (user_id, status);
create index if not exists ideas_user_platform_idx on public.ideas (user_id, platform_id);
create index if not exists ideas_user_created_idx on public.ideas (user_id, created_at desc);
create index if not exists publications_user_date_idx on public.publications (user_id, publication_date);
create index if not exists publications_user_status_idx on public.publications (user_id, status);
create index if not exists publications_user_idea_idx on public.publications (user_id, idea_id);
create index if not exists publication_channels_user_platform_idx on public.publication_channels (user_id, platform_id);
create index if not exists checkpoints_user_date_idx on public.checkpoints (user_id, checkpoint_date);
create index if not exists templates_user_category_idx on public.templates (user_id, category);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists platforms_updated_at on public.platforms;
create trigger platforms_updated_at before update on public.platforms for each row execute function public.set_updated_at();
drop trigger if exists platform_metrics_updated_at on public.platform_metrics;
create trigger platform_metrics_updated_at before update on public.platform_metrics for each row execute function public.set_updated_at();
drop trigger if exists goals_updated_at on public.goals;
create trigger goals_updated_at before update on public.goals for each row execute function public.set_updated_at();
drop trigger if exists ideas_updated_at on public.ideas;
create trigger ideas_updated_at before update on public.ideas for each row execute function public.set_updated_at();
drop trigger if exists publications_updated_at on public.publications;
create trigger publications_updated_at before update on public.publications for each row execute function public.set_updated_at();
drop trigger if exists checkpoints_updated_at on public.checkpoints;
create trigger checkpoints_updated_at before update on public.checkpoints for each row execute function public.set_updated_at();
drop trigger if exists templates_updated_at on public.templates;
create trigger templates_updated_at before update on public.templates for each row execute function public.set_updated_at();
drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at before update on public.user_settings for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.platforms enable row level security;
alter table public.platform_metrics enable row level security;
alter table public.goals enable row level security;
alter table public.ideas enable row level security;
alter table public.publications enable row level security;
alter table public.publication_channels enable row level security;
alter table public.checkpoints enable row level security;
alter table public.templates enable row level security;
alter table public.template_files enable row level security;
alter table public.publication_files enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles_own_all" on public.profiles;
drop policy if exists "platforms_own_all" on public.platforms;
drop policy if exists "platform_metrics_own_all" on public.platform_metrics;
drop policy if exists "goals_own_all" on public.goals;
drop policy if exists "ideas_own_all" on public.ideas;
drop policy if exists "publications_own_all" on public.publications;
drop policy if exists "publication_channels_own_all" on public.publication_channels;
drop policy if exists "checkpoints_own_all" on public.checkpoints;
drop policy if exists "templates_own_all" on public.templates;
drop policy if exists "template_files_own_all" on public.template_files;
drop policy if exists "publication_files_own_all" on public.publication_files;
drop policy if exists "user_settings_own_all" on public.user_settings;

create policy "profiles_own_all" on public.profiles for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "platforms_own_all" on public.platforms for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "platform_metrics_own_all" on public.platform_metrics for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_own_all" on public.goals for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ideas_own_all" on public.ideas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "publications_own_all" on public.publications for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "publication_channels_own_all" on public.publication_channels for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "checkpoints_own_all" on public.checkpoints for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "templates_own_all" on public.templates for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "template_files_own_all" on public.template_files for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "publication_files_own_all" on public.publication_files for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_settings_own_all" on public.user_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('platform-icons', 'platform-icons', false, 1048576, array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
  ('template-files', 'template-files', false, 10485760, array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'application/pdf', 'text/plain']),
  ('publication-files', 'publication-files', false, 10485760, array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'application/pdf', 'text/plain']),
  ('profile-assets', 'profile-assets', false, 5242880, array['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "influera_storage_select_own" on storage.objects;
drop policy if exists "influera_storage_insert_own" on storage.objects;
drop policy if exists "influera_storage_update_own" on storage.objects;
drop policy if exists "influera_storage_delete_own" on storage.objects;

create policy "influera_storage_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('platform-icons', 'template-files', 'publication-files', 'profile-assets')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "influera_storage_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('platform-icons', 'template-files', 'publication-files', 'profile-assets')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "influera_storage_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('platform-icons', 'template-files', 'publication-files', 'profile-assets')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('platform-icons', 'template-files', 'publication-files', 'profile-assets')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "influera_storage_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('platform-icons', 'template-files', 'publication-files', 'profile-assets')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create or replace function public.migrate_user_workspace_to_normalized(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace jsonb;
begin
  if auth.uid() <> target_user_id then
    raise exception 'Not allowed';
  end if;

  select data into workspace
  from public.user_workspaces
  where user_id = target_user_id;

  if workspace is null then
    return;
  end if;

  insert into public.profiles (
    user_id, name, niche, positioning, description, target_audience,
    main_topics, rubrics, tone, expertise, opportunities
  )
  values (
    target_user_id,
    coalesce(workspace #>> '{profile,name}', ''),
    coalesce(workspace #>> '{profile,niche}', ''),
    coalesce(workspace #>> '{profile,positioning}', ''),
    coalesce(workspace #>> '{profile,description}', ''),
    coalesce(workspace #>> '{profile,targetAudience}', ''),
    coalesce(workspace #>> '{profile,mainTopics}', ''),
    coalesce(workspace #>> '{profile,rubrics}', ''),
    coalesce(workspace #>> '{profile,tone}', ''),
    coalesce(workspace #>> '{profile,expertise}', ''),
    coalesce(workspace #>> '{profile,opportunities}', '')
  )
  on conflict (user_id) do update set
    name = excluded.name,
    niche = excluded.niche,
    positioning = excluded.positioning,
    description = excluded.description,
    target_audience = excluded.target_audience,
    main_topics = excluded.main_topics,
    rubrics = excluded.rubrics,
    tone = excluded.tone,
    expertise = excluded.expertise,
    opportunities = excluded.opportunities;

  insert into public.platforms (
    id, user_id, name, username, url, subscribers, target_subscribers,
    role, weekly_plan, accent_color, icon_url, mirror_platform_ids
  )
  select
    p->>'id',
    target_user_id,
    coalesce(p->>'name', ''),
    coalesce(p->>'username', ''),
    coalesce(p->>'url', ''),
    coalesce((p->>'subscribers')::integer, 0),
    coalesce((p->>'targetSubscribers')::integer, 0),
    coalesce(p->>'role', 'дополнительная'),
    coalesce((p->>'weeklyPlan')::integer, 0),
    p->>'accentColor',
    p->>'iconUrl',
    coalesce(array(select jsonb_array_elements_text(coalesce(p->'mirrorPlatformIds', '[]'::jsonb))), '{}')
  from jsonb_array_elements(coalesce(workspace->'platforms', '[]'::jsonb)) p
  on conflict (user_id, id) do update set
    name = excluded.name,
    username = excluded.username,
    url = excluded.url,
    subscribers = excluded.subscribers,
    target_subscribers = excluded.target_subscribers,
    role = excluded.role,
    weekly_plan = excluded.weekly_plan,
    accent_color = excluded.accent_color,
    icon_url = excluded.icon_url,
    mirror_platform_ids = excluded.mirror_platform_ids;

  insert into public.platform_metrics (id, user_id, platform_id, metric_date, subscribers, notes)
  select
    'legacy-' || (p->>'id') || '-' || current_date::text,
    target_user_id,
    p->>'id',
    current_date,
    coalesce((p->>'subscribers')::integer, 0),
    'Imported from legacy workspace'
  from jsonb_array_elements(coalesce(workspace->'platforms', '[]'::jsonb)) p
  on conflict (user_id, platform_id, metric_date) do update set
    subscribers = excluded.subscribers,
    notes = excluded.notes;

  insert into public.goals (id, user_id, title, type, current_value, target_value, deadline, platform_id, is_primary)
  select
    g->>'id',
    target_user_id,
    coalesce(g->>'title', ''),
    coalesce(g->>'type', ''),
    coalesce((g->>'currentValue')::numeric, 0),
    coalesce((g->>'targetValue')::numeric, 0),
    coalesce((g->>'deadline')::timestamptz, now()),
    nullif(g->>'platformId', ''),
    coalesce((g->>'isPrimary')::boolean, false)
  from jsonb_array_elements(coalesce(workspace->'goals', '[]'::jsonb)) g
  on conflict (user_id, id) do update set
    title = excluded.title,
    type = excluded.type,
    current_value = excluded.current_value,
    target_value = excluded.target_value,
    deadline = excluded.deadline,
    platform_id = excluded.platform_id,
    is_primary = excluded.is_primary;

  insert into public.ideas (id, user_id, title, description, format, platform_id, priority, status, created_at)
  select
    i->>'id',
    target_user_id,
    coalesce(i->>'title', ''),
    coalesce(i->>'description', ''),
    coalesce(i->>'format', 'пост'),
    nullif(i->>'platformId', ''),
    coalesce(i->>'priority', 'средний'),
    coalesce(i->>'status', 'новая'),
    coalesce((i->>'createdAt')::timestamptz, now())
  from jsonb_array_elements(coalesce(workspace->'ideas', '[]'::jsonb)) i
  on conflict (user_id, id) do update set
    title = excluded.title,
    description = excluded.description,
    format = excluded.format,
    platform_id = excluded.platform_id,
    priority = excluded.priority,
    status = excluded.status;

  insert into public.publications (id, user_id, title, publication_date, format, status, idea_id, note, url)
  select
    p->>'id',
    target_user_id,
    coalesce(p->>'title', ''),
    coalesce((p->>'date')::timestamptz, now()),
    coalesce(p->>'format', 'пост'),
    coalesce(p->>'status', 'запланировано'),
    nullif(p->>'ideaId', ''),
    nullif(p->>'note', ''),
    nullif(p->>'url', '')
  from jsonb_array_elements(coalesce(workspace->'publications', '[]'::jsonb)) p
  on conflict (user_id, id) do update set
    title = excluded.title,
    publication_date = excluded.publication_date,
    format = excluded.format,
    status = excluded.status,
    idea_id = excluded.idea_id,
    note = excluded.note,
    url = excluded.url;

  insert into public.publication_channels (publication_id, platform_id, user_id)
  select p->>'id', p->>'platformId', target_user_id
  from jsonb_array_elements(coalesce(workspace->'publications', '[]'::jsonb)) p
  where nullif(p->>'platformId', '') is not null
  on conflict (user_id, publication_id, platform_id) do nothing;

  insert into public.checkpoints (id, user_id, type, checkpoint_date, note)
  select
    c->>'id',
    target_user_id,
    coalesce(c->>'type', 'контент_план'),
    coalesce((c->>'date')::timestamptz, now()),
    nullif(c->>'note', '')
  from jsonb_array_elements(coalesce(workspace->'checkpoints', '[]'::jsonb)) c
  on conflict (user_id, id) do update set
    type = excluded.type,
    checkpoint_date = excluded.checkpoint_date,
    note = excluded.note;

  insert into public.templates (id, user_id, name, category, formats, description, usage, content)
  select
    t->>'id',
    target_user_id,
    coalesce(t->>'name', ''),
    coalesce(t->>'category', 'сценарий'),
    coalesce(array(select jsonb_array_elements_text(coalesce(t->'format', '[]'::jsonb))), '{}'),
    coalesce(t->>'description', ''),
    coalesce(t->>'usage', ''),
    coalesce(t->>'content', '')
  from jsonb_array_elements(coalesce(workspace->'templates', '[]'::jsonb)) t
  on conflict (user_id, id) do update set
    name = excluded.name,
    category = excluded.category,
    formats = excluded.formats,
    description = excluded.description,
    usage = excluded.usage,
    content = excluded.content;
end;
$$;

grant execute on function public.migrate_user_workspace_to_normalized(uuid) to authenticated;
