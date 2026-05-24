alter table public.profiles
  add column if not exists avatar_storage_path text,
  add column if not exists cover_storage_path text;

create index if not exists template_files_user_template_idx
  on public.template_files (user_id, template_id);

create index if not exists publication_files_user_publication_idx
  on public.publication_files (user_id, publication_id);

create or replace function public.influera_storage_orphan_candidates(target_bucket text)
returns table(bucket_id text, name text, created_at timestamptz)
language sql
security definer
set search_path = public, storage
as $$
  select objects.bucket_id, objects.name, objects.created_at
  from storage.objects
  where objects.bucket_id = target_bucket
    and (storage.foldername(objects.name))[1] = auth.uid()::text
    and (
      (target_bucket = 'template-files' and not exists (
        select 1 from public.template_files tf
        where tf.user_id = auth.uid() and tf.storage_path = objects.name
      ))
      or
      (target_bucket = 'publication-files' and not exists (
        select 1 from public.publication_files pf
        where pf.user_id = auth.uid() and pf.storage_path = objects.name
      ))
      or
      (target_bucket = 'platform-icons' and not exists (
        select 1 from public.platforms p
        where p.user_id = auth.uid() and p.icon_storage_path = objects.name
      ))
      or
      (target_bucket = 'profile-assets' and not exists (
        select 1 from public.profiles pr
        where pr.user_id = auth.uid()
          and objects.name in (pr.avatar_storage_path, pr.cover_storage_path)
      ))
    );
$$;

grant execute on function public.influera_storage_orphan_candidates(text) to authenticated;

