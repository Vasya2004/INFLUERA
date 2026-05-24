import type { AppState } from "./types";
import { parseAppState } from "./app-state-schema";
import { isSupabaseConfigured, supabase } from "./supabase";
import { withTimeout } from "./async-utils";
import { loadNormalizedWorkspace, saveWorkspace } from "./workspace-api";

export type WorkspaceMigrationStatus =
  | { state: "unavailable" }
  | { state: "not_needed" }
  | { state: "pending"; legacySummary: string }
  | { state: "completed"; migratedAt: string }
  | { state: "failed"; message: string };

const MIGRATION_FLAG_KEY = "legacyWorkspaceMigratedAt";

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || /relation .* does not exist/i.test(error.message ?? "");
}

function isMissingRpcError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message ?? "";
  return (
    error.code === "PGRST202"
    || /migrate_user_workspace_to_normalized/i.test(message)
    || /function .* does not exist/i.test(message)
  );
}

export function summarizeLegacyWorkspace(state: AppState): string {
  const parts = [
    `${state.platforms.length} платформ`,
    `${state.goals.length} целей`,
    `${state.ideas.length} идей`,
    `${state.publications.length} публикаций`,
  ];
  return parts.join(", ");
}

export function workspaceHasMeaningfulData(state: AppState | null): boolean {
  if (!state) return false;
  return Boolean(
    state.profile?.name?.trim()
    || state.platforms.length > 0
    || (state.platformMetrics?.length ?? 0) > 0
    || state.goals.length > 0
    || state.ideas.length > 0
    || state.publications.length > 0
    || state.checkpoints.length > 0
    || state.templates.length > 0,
  );
}

export async function isNormalizedSchemaAvailable(): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("profiles").select("user_id").limit(1);
  if (isMissingRelationError(error)) return false;
  if (error) throw error;
  return true;
}

export async function loadLegacyWorkspace(userId: string): Promise<AppState | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_workspaces")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }

  if (!data?.data || typeof data.data !== "object") return null;
  return parseAppState(data.data);
}

export async function hasNormalizedWorkspaceData(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const checks = await Promise.all([
    supabase.from("profiles").select("user_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("platforms").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("goals").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("ideas").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("publications").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  for (const result of checks) {
    if (isMissingRelationError(result.error)) return false;
    if (result.error) throw result.error;
    if ((result.count ?? 0) > 0) return true;
  }

  return false;
}

async function readMigrationTimestamp(userId: string): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_settings")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (isMissingRelationError(error)) return null;
  if (error) throw error;

  const value = data?.data?.[MIGRATION_FLAG_KEY];
  return typeof value === "string" ? value : null;
}

async function markMigrationCompleted(userId: string): Promise<void> {
  if (!supabase) return;

  const { data, error: readError } = await supabase
    .from("user_settings")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (isMissingRelationError(readError)) return;
  if (readError) throw readError;

  const nextData = {
    ...(typeof data?.data === "object" && data.data ? data.data : {}),
    [MIGRATION_FLAG_KEY]: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_settings").upsert(
    { user_id: userId, data: nextData },
    { onConflict: "user_id" },
  );

  if (isMissingRelationError(error)) return;
  if (error) throw error;
}

export async function getWorkspaceMigrationStatus(userId: string): Promise<WorkspaceMigrationStatus> {
  if (!isSupabaseConfigured() || !supabase) return { state: "unavailable" };

  const schemaReady = await isNormalizedSchemaAvailable();
  if (!schemaReady) return { state: "unavailable" };

  const migratedAt = await readMigrationTimestamp(userId);
  const [hasNormalized, legacy] = await Promise.all([
    hasNormalizedWorkspaceData(userId),
    loadLegacyWorkspace(userId),
  ]);

  const hasLegacy = workspaceHasMeaningfulData(legacy);

  if (hasNormalized) {
    if (migratedAt) return { state: "completed", migratedAt };
    return { state: "not_needed" };
  }

  if (!hasLegacy) {
    return { state: "not_needed" };
  }

  if (migratedAt) {
    return { state: "failed", message: "Данные в legacy есть, но нормализованные таблицы пусты. Запустите миграцию повторно." };
  }

  return {
    state: "pending",
    legacySummary: summarizeLegacyWorkspace(legacy!),
  };
}

async function migrateViaRpc(userId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase не настроен");

  const { error } = await supabase.rpc("migrate_user_workspace_to_normalized", {
    target_user_id: userId,
  });

  if (error) {
    if (isMissingRpcError(error)) {
      throw new Error("RPC migrate_user_workspace_to_normalized не найден. Примените SQL-миграции Supabase.");
    }
    throw error;
  }
}

async function migrateViaClient(userId: string, legacy: AppState): Promise<void> {
  await saveWorkspace(userId, legacy);
}

/** Переносит JSONB workspace в нормализованные таблицы и возвращает актуальный AppState. */
export async function migrateLegacyWorkspaceToNormalized(userId: string): Promise<AppState> {
  const legacy = await loadLegacyWorkspace(userId);
  if (!workspaceHasMeaningfulData(legacy)) {
    throw new Error("Legacy workspace пуст — мигрировать нечего.");
  }

  try {
    await withTimeout(migrateViaRpc(userId), 15_000, "Таймаут миграции legacy workspace");
  } catch (rpcError) {
    const message = rpcError instanceof Error ? rpcError.message : "Ошибка RPC-миграции";
    if (!message.includes("RPC") && !message.includes("не найден")) {
      throw rpcError;
    }
    await migrateViaClient(userId, legacy!);
  }

  const migrated = await loadNormalizedWorkspace(userId);
  if (!workspaceHasMeaningfulData(migrated)) {
    throw new Error("После миграции нормализованные данные не загрузились.");
  }

  await markMigrationCompleted(userId);
  return migrated!;
}

export async function ensureWorkspaceMigrated(userId: string): Promise<WorkspaceMigrationStatus> {
  const status = await getWorkspaceMigrationStatus(userId);
  if (status.state !== "pending") return status;

  try {
    await migrateLegacyWorkspaceToNormalized(userId);
    const migratedAt = (await readMigrationTimestamp(userId)) ?? new Date().toISOString();
    return { state: "completed", migratedAt };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось выполнить миграцию";
    return { state: "failed", message };
  }
}
