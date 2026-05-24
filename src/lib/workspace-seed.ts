import type { AppState } from "./types";
import { createDemoAppState, createEmptyAppState } from "./demo-seed";
import { isSupabaseConfigured, supabase } from "./supabase";
import { saveWorkspace } from "./workspace-api";
import {
  hasNormalizedWorkspaceData,
  isNormalizedSchemaAvailable,
  loadLegacyWorkspace,
  workspaceHasMeaningfulData,
} from "./workspace-migration";

export const DEMO_SEED_FLAG_KEY = "demoSeedAppliedAt";

export type DemoSeedSkipReason =
  | "unavailable"
  | "has_cloud_data"
  | "has_legacy_data"
  | "already_applied";

export type DemoSeedResult =
  | { status: "seeded"; state: AppState; forced: boolean }
  | { status: "skipped"; reason: DemoSeedSkipReason };

export function shouldAutoApplyDemoSeed(input: {
  hasNormalized: boolean;
  hasLegacy: boolean;
  demoSeedApplied: boolean;
  hasLocalData: boolean;
}): boolean {
  if (input.hasNormalized || input.hasLegacy || input.hasLocalData) return false;
  if (input.demoSeedApplied) return false;
  return true;
}

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || /relation .* does not exist/i.test(error.message ?? "");
}

async function readUserSettingsData(userId: string): Promise<Record<string, unknown>> {
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("user_settings")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (isMissingRelationError(error)) return {};
  if (error) throw error;

  return typeof data?.data === "object" && data.data && !Array.isArray(data.data)
    ? (data.data as Record<string, unknown>)
    : {};
}

export async function isDemoSeedApplied(userId: string): Promise<boolean> {
  const settings = await readUserSettingsData(userId);
  return typeof settings[DEMO_SEED_FLAG_KEY] === "string";
}

export async function recordDemoSeedApplied(userId: string): Promise<void> {
  if (!supabase) return;

  const current = await readUserSettingsData(userId);
  const nextData = {
    ...current,
    [DEMO_SEED_FLAG_KEY]: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_settings").upsert(
    { user_id: userId, data: nextData },
    { onConflict: "user_id" },
  );

  if (isMissingRelationError(error)) return;
  if (error) throw error;
}

/** Идемпотентно записывает демо-данные в нормализованные таблицы. */
export async function applyDemoWorkspaceSeed(
  userId: string,
  options: { force?: boolean } = {},
): Promise<DemoSeedResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { status: "skipped", reason: "unavailable" };
  }

  const schemaReady = await isNormalizedSchemaAvailable().catch(() => false);
  if (!schemaReady) {
    return { status: "skipped", reason: "unavailable" };
  }

  const [hasNormalized, legacy, demoSeedApplied] = await Promise.all([
    hasNormalizedWorkspaceData(userId),
    loadLegacyWorkspace(userId),
    isDemoSeedApplied(userId),
  ]);

  const hasLegacy = workspaceHasMeaningfulData(legacy);

  if (!options.force) {
    if (hasNormalized) return { status: "skipped", reason: "has_cloud_data" };
    if (hasLegacy) return { status: "skipped", reason: "has_legacy_data" };
    if (demoSeedApplied) return { status: "skipped", reason: "already_applied" };
  }

  const demo = createDemoAppState();
  await saveWorkspace(userId, demo);
  await recordDemoSeedApplied(userId);

  return { status: "seeded", state: demo, forced: Boolean(options.force) };
}

/**
 * Для нового пустого аккаунта: один раз подставляет демо.
 * Если демо уже применялось — возвращает пустое состояние.
 */
export async function ensureDemoWorkspaceSeeded(userId: string): Promise<AppState | null> {
  const result = await applyDemoWorkspaceSeed(userId);
  if (result.status === "seeded") return result.state;
  return null;
}

/** Первичное заполнение пустого облака: local → демо → пусто. */
export async function bootstrapEmptyCloudWorkspace(
  userId: string,
  local: AppState | null,
): Promise<AppState> {
  if (local && workspaceHasMeaningfulData(local)) {
    await saveWorkspace(userId, local);
    return local;
  }

  const seeded = await ensureDemoWorkspaceSeeded(userId);
  if (seeded) return seeded;

  return createEmptyAppState();
}
