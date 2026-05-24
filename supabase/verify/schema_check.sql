-- Influera Phase 1: проверка схемы после миграций
-- Запустите в Supabase SQL Editor после apply всех migrations.

do $$
declare
  expected_tables text[] := array[
    'user_workspaces',
    'profiles',
    'platforms',
    'platform_metrics',
    'goals',
    'ideas',
    'publications',
    'publication_channels',
    'checkpoints',
    'templates',
    'template_files',
    'publication_files',
    'user_settings'
  ];
  t text;
  missing_tables text[] := '{}';
  rls_off text[] := '{}';
  bucket_missing text[] := '{}';
  expected_buckets text[] := array[
    'platform-icons',
    'template-files',
    'publication-files',
    'profile-assets'
  ];
  b text;
begin
  foreach t in array expected_tables loop
    if not exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = t
    ) then
      missing_tables := array_append(missing_tables, t);
    end if;
  end loop;

  if array_length(missing_tables, 1) is not null then
    raise exception 'Missing tables: %', array_to_string(missing_tables, ', ');
  end if;

  foreach t in array expected_tables loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = t
        and c.relrowsecurity
    ) then
      rls_off := array_append(rls_off, t);
    end if;
  end loop;

  if array_length(rls_off, 1) is not null then
    raise exception 'RLS disabled on: %', array_to_string(rls_off, ', ');
  end if;

  foreach b in array expected_buckets loop
    if not exists (select 1 from storage.buckets where id = b) then
      bucket_missing := array_append(bucket_missing, b);
    end if;
  end loop;

  if array_length(bucket_missing, 1) is not null then
    raise exception 'Missing storage buckets: %', array_to_string(bucket_missing, ', ');
  end if;

  raise notice 'OK: all tables, RLS, and storage buckets are present';
end;
$$;

-- Сводка по таблицам
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  (
    select count(*)
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = c.relname
  ) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'user_workspaces', 'profiles', 'platforms', 'platform_metrics', 'goals',
    'ideas', 'publications', 'publication_channels', 'checkpoints', 'templates',
    'template_files', 'publication_files', 'user_settings'
  )
order by c.relname;

-- Индексы (календарь, статусы, платформы, даты)
select indexname, tablename
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'platform_metrics_user_platform_date_idx',
    'publications_user_date_idx',
    'publications_user_status_idx',
    'ideas_user_status_idx',
    'goals_user_deadline_idx'
  )
order by tablename, indexname;

-- Storage buckets
select id, public, file_size_limit
from storage.buckets
where id in ('platform-icons', 'template-files', 'publication-files', 'profile-assets')
order by id;
