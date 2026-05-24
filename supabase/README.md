# Supabase migrations — Influera

## Phase 1: прогон на чистом проекте

### Порядок файлов (строго по имени)

1. `migrations/20250516000000_user_workspaces.sql` — legacy JSONB workspace
2. `migrations/20250524000000_normalized_service_schema.sql` — нормализованные таблицы, RLS, Storage, legacy migration function
3. `migrations/20250524000001_improve_legacy_migration.sql` — улучшенная RPC-миграция (platformMetrics, флаг в user_settings)
4. `migrations/20250525120000_ideas_tags.sql` — теги для идей (`tags text[]`)
5. `verify/schema_check.sql` — проверка, что всё создалось

### Способ A — Supabase Dashboard (без CLI)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard) → ваш проект **Influera**
2. **SQL Editor** → **New query**
3. Скопируйте **целиком** содержимое `20250516000000_user_workspaces.sql` → **Run**
4. Новый query → скопируйте `20250524000000_normalized_service_schema.sql` → **Run**
5. Новый query → скопируйте `20250524000001_improve_legacy_migration.sql` → **Run**
6. Новый query → скопируйте `verify/schema_check.sql` → **Run**

Ожидаемый результат шага 5: `NOTICE: OK: all tables, RLS, and storage buckets are present` и таблицы со `rls_enabled = true`.

### Способ B — Supabase CLI

```bash
# Установка CLI: https://supabase.com/docs/guides/cli
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Затем в SQL Editor выполните `verify/schema_check.sql`.

### Чистый проект vs уже существующий

| Ситуация | Действие |
|----------|----------|
| Новый проект, пустая БД | Прогоните оба migration-файла по порядку |
| Уже есть только `user_workspaces` | Прогоните только `20250524000000_normalized_service_schema.sql` |
| Ошибка «policy already exists» | Миграции обновлены: перед `create policy` идёт `drop policy if exists` — перезапустите файл |
| Ошибка синтаксиса FK `set null (platform_id)` | Исправлено на `on delete restrict` — обновите файл и запустите снова |

### Таблицы после миграции

- `user_workspaces` (legacy fallback)
- `profiles`, `platforms`, `platform_metrics`, `goals`, `ideas`
- `publications`, `publication_channels`, `checkpoints`
- `templates`, `template_files`, `publication_files`
- `user_settings`

### Storage buckets

- `platform-icons`
- `template-files`
- `publication-files`
- `profile-assets`

### Checklist (Phase 1)

См. `docs/supabase/CHECKLIST.md`
