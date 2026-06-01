import type { Profile } from "../types";
import { mapProfileForDb } from "../data/mappers";
import { upsertRow } from "./db";

export async function saveProfile(userId: string, profile: Profile) {
  await upsertRow("profiles", await mapProfileForDb(userId, profile), ["user_id"]);
}
