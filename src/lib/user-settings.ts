import { isSupabaseConfigured, supabase } from "./supabase";

export const ONBOARDING_COMPLETED_AT_KEY = "onboardingCompletedAt";

export type UserSettingsData = Record<string, unknown> & {
  onboardingCompletedAt?: string;
};

function isMissingRelationError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return error.code === "42P01" || /relation .* does not exist/i.test(error.message ?? "");
}

function asSettingsData(value: unknown): UserSettingsData {
  return typeof value === "object" && value && !Array.isArray(value)
    ? (value as UserSettingsData)
    : {};
}

export async function readUserSettings(userId: string): Promise<UserSettingsData> {
  if (!isSupabaseConfigured() || !supabase) return {};

  const { data, error } = await supabase
    .from("user_settings")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (isMissingRelationError(error)) return {};
  if (error) throw error;

  return asSettingsData(data?.data);
}

export async function saveUserSettings(userId: string, patch: UserSettingsData): Promise<UserSettingsData> {
  if (!isSupabaseConfigured() || !supabase) return patch;

  const current = await readUserSettings(userId);
  const nextData = { ...current, ...patch };
  const { error } = await supabase.from("user_settings").upsert(
    { user_id: userId, data: nextData },
    { onConflict: "user_id" },
  );

  if (isMissingRelationError(error)) return nextData;
  if (error) throw error;

  return nextData;
}

export async function markOnboardingCompleted(userId: string, completedAt = new Date().toISOString()) {
  return saveUserSettings(userId, { [ONBOARDING_COMPLETED_AT_KEY]: completedAt });
}

export function isOnboardingCompleted(settings: UserSettingsData) {
  return typeof settings[ONBOARDING_COMPLETED_AT_KEY] === "string";
}

