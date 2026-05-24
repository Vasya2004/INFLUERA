# Supabase checklist — Influera

## Environment (`.env` / Vercel)

- [ ] `VITE_SUPABASE_URL` — Project URL **без** `/rest/v1`
- [ ] `VITE_SUPABASE_ANON_KEY` — publishable (или legacy anon) key
- [ ] Dev-сервер перезапущен после изменения `.env`

## Authentication → URL Configuration

- [ ] Site URL: `http://localhost:5173` (dev)
- [ ] Redirect URLs:
  - `http://localhost:5173`
  - `http://localhost:5173/reset-password`
- [ ] Production URLs добавлены при деплое на Vercel

## Database migrations

- [ ] `20250516000000_user_workspaces.sql` выполнен
- [ ] `20250524000000_normalized_service_schema.sql` выполнен
- [ ] `20250524000001_improve_legacy_migration.sql` выполнен
- [ ] `supabase/verify/schema_check.sql` — без ошибок

## RLS

- [ ] На всех 13 таблицах `public.*` включён RLS
- [ ] У каждой таблицы есть policy `*_own_all` для `authenticated`

## Storage

- [ ] Buckets: `platform-icons`, `template-files`, `publication-files`, `profile-assets`
- [ ] Policies `influera_storage_*_own` на `storage.objects`

## Auth providers

- [ ] Email provider: вход по паролю включён (если нужен login)
- [ ] Sign ups: по решению продукта (вручную через Dashboard или через форму)

## Functions

- [ ] `migrate_user_workspace_to_normalized(uuid)` — `GRANT EXECUTE` для `authenticated`
