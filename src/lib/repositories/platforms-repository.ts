import type { Platform } from "../types";
import { mapPlatformForDb } from "../data/mappers";
import { deleteRow, upsertRow } from "./db";

export async function savePlatform(userId: string, platform: Platform) {
  const row = await mapPlatformForDb(userId, platform);
  await upsertRow("platforms", row, ["user_id", "id"]);
}

export async function savePlatforms(userId: string, platforms: Platform[]) {
  for (const platform of platforms) {
    await savePlatform(userId, platform);
  }
}

export async function removePlatform(userId: string, platformId: string) {
  await deleteRow("platforms", userId, platformId);
}
