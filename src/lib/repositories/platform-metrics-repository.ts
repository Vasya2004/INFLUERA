import type { PlatformMetric } from "../types";
import { mapPlatformMetricForDb } from "../data/mappers";
import { classifyApiError } from "../api-errors";
import { deleteRow, requireSupabase, upsertRow } from "./db";

export async function savePlatformMetric(userId: string, metric: PlatformMetric) {
  await upsertRow("platform_metrics", mapPlatformMetricForDb(userId, metric), ["user_id", "id"]);
}

export async function removePlatformMetric(userId: string, metricId: string) {
  await deleteRow("platform_metrics", userId, metricId);
}

export async function removeMetricsForPlatform(userId: string, platformId: string) {
  const client = requireSupabase();
  const { error } = await client
    .from("platform_metrics")
    .delete()
    .eq("user_id", userId)
    .eq("platform_id", platformId);
  if (error) throw classifyApiError(error);
}
