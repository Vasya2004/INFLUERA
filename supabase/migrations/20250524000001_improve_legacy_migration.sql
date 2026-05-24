-- Phase 1: улучшенная legacy-миграция (platformMetrics + user_settings flag)

create or replace function public.migrate_user_workspace_to_normalized(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace jsonb;
  migrated_at timestamptz := now();
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
    coalesce(m->>'id', 'legacy-' || (m->>'platformId') || '-' || coalesce(left(m->>'date', 10), current_date::text)),
    target_user_id,
    m->>'platformId',
    coalesce(left(m->>'date', 10)::date, current_date),
    coalesce((m->>'subscribers')::integer, 0),
    coalesce(m->>'notes', 'Imported from legacy workspace')
  from jsonb_array_elements(coalesce(workspace->'platformMetrics', '[]'::jsonb)) m
  where nullif(m->>'platformId', '') is not null
  on conflict (user_id, id) do update set
    metric_date = excluded.metric_date,
    subscribers = excluded.subscribers,
    notes = excluded.notes;

  insert into public.platform_metrics (id, user_id, platform_id, metric_date, subscribers, notes)
  select
    'legacy-' || (p->>'id') || '-' || current_date::text,
    target_user_id,
    p->>'id',
    current_date,
    coalesce((p->>'subscribers')::integer, 0),
    'Imported from legacy workspace (platform snapshot)'
  from jsonb_array_elements(coalesce(workspace->'platforms', '[]'::jsonb)) p
  where not exists (
    select 1
    from jsonb_array_elements(coalesce(workspace->'platformMetrics', '[]'::jsonb)) m
    where m->>'platformId' = p->>'id'
  )
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

  insert into public.user_settings (user_id, data)
  values (
    target_user_id,
    jsonb_build_object('legacyWorkspaceMigratedAt', migrated_at)
  )
  on conflict (user_id) do update set
    data = coalesce(public.user_settings.data, '{}'::jsonb)
      || jsonb_build_object('legacyWorkspaceMigratedAt', migrated_at),
    updated_at = migrated_at;
end;
$$;

grant execute on function public.migrate_user_workspace_to_normalized(uuid) to authenticated;
