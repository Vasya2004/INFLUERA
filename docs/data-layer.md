# Data Layer (Phase 2)

## Architecture

- `src/lib/data/dto.ts` — типы строк Supabase
- `src/lib/data/mappers.ts` — DTO ↔ доменные модели
- `src/lib/repositories/*` — CRUD по сущностям
- `src/lib/sync/cloud-sync.ts` — фасад синхронизации для Store
- `src/lib/queries/*` — React Query keys и hooks
- `src/lib/api-errors.ts` — классификация ошибок (network, auth, RLS, validation)

## Синхронизация

| Операция | Поведение |
|----------|-----------|
| Обычные изменения (платформа, идея, публикация…) | Точечный upsert/delete в одну таблицу |
| Первый вход / демо / сброс / legacy migration | `saveFullWorkspace` (bulk) |

## Экспорт

**Настройки → Экспорт** при облачном аккаунте читает актуальные данные из нормализованных таблиц Supabase.

## React Query

- `useWorkspaceQuery` — загрузка workspace
- `usePublicationMutations` / `usePlatformMutations` — optimistic updates (готовы для прямого использования в страницах)
- Store по-прежнему использует `useStore()`; внутри — entity sync + cache patch
