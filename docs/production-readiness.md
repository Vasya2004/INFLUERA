# INFLUERA Production Readiness

## Supabase

1. Apply migrations in order:
   - `20250516000000_user_workspaces.sql`
   - `20250524000000_normalized_service_schema.sql`
   - `20250524000001_improve_legacy_migration.sql`
   - `20250525120000_ideas_tags.sql`
   - `20260524000000_storage_assets_phase6.sql`
   - `20260524000001_account_requests.sql`
   - `20260524000002_idea_detail_fields.sql`
2. Confirm these private Storage buckets exist:
   - `platform-icons`
   - `template-files`
   - `publication-files`
   - `profile-assets`
3. Confirm RLS is enabled on all user-owned tables and `storage.objects` policies require the first path segment to equal `auth.uid()`.
4. For existing accounts, call `public.migrate_user_workspace_to_normalized(auth.uid())` once after login or run it manually from an authenticated SQL session.

## Storage And Files

Client-side file rules must match Storage bucket limits:

- `platform-icons`: images only, 1 MB, path `<user_id>/<platform_id>.<ext>`.
- `profile-assets`: images only, 5 MB, path `<user_id>/avatar.<ext>` or `<user_id>/cover.<ext>`.
- `template-files`: images/PDF/TXT, 10 MB, path `<user_id>/<template_id>/<file_id>-<name>.<ext>`.
- `publication-files`: images/PDF/TXT, 10 MB, path `<user_id>/<publication_id>/<file_id>-<name>.<ext>`.

Files are referenced from database rows by `storage_path`; signed URLs are generated only for display/download. When a row or file reference is deleted, the repository removes the related Storage object. For periodic cleanup, call `public.influera_storage_orphan_candidates(bucket_id)` for each bucket and remove stale objects after a grace period.

## Vercel

Set environment variables:

```txt
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Supabase Auth URL settings:

```txt
Site URL: https://your-domain.com
Redirect URLs:
  https://your-domain.com
  https://your-domain.com/reset-password
```

## Release Checks

Run before deployment:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Manual QA:

- Sign in and confirm normalized data loads.
- New account: confirm `/onboarding` appears, complete profile/platform/goal/idea/publication, then confirm dashboard opens and `user_settings.data.onboardingCompletedAt` is set.
- Create/edit/delete a platform, idea, publication, checkpoint, goal, and template.
- Upload a platform icon and reload the app; the icon should resolve via signed Storage URL.
- Upload template files and publication files; reload the app; download links should resolve via signed Storage URLs.
- Upload profile avatar and cover; reload the app; remove each asset and confirm it disappears after save.
- Trigger cloud sync error/recovery scenario and use Settings → "Выгрузить локальные данные в облако".
- Request account deletion and confirm a row appears in `account_deletion_requests`.
- Update subscriber count and confirm a platform metric row is created.
- Open `/content-plan` and check month, week, and list views.
- Export JSON from settings.
