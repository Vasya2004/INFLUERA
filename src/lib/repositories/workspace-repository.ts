import type { AppState } from "../types";
import { classifyApiError } from "../api-errors";
import {
  mapCheckpoint,
  mapCheckpointForDb,
  mapGoal,
  mapGoalForDb,
  mapIdea,
  mapIdeaForDb,
  mapPlatform,
  mapPlatformForDb,
  mapPlatformMetric,
  mapPlatformMetricForDb,
  mapProfile,
  mapProfileForDb,
  mapPublication,
  mapPublicationFiles,
  mapPublicationForDb,
  mapReference,
  mapReferenceForDb,
  mapTemplate,
  mapTemplateFiles,
  mapTemplateForDb,
} from "../data/mappers";
import type {
  CheckpointRow,
  CreatorReferenceRow,
  GoalRow,
  IdeaRow,
  PlatformMetricRow,
  PlatformRow,
  ProfileRow,
  PublicationFileRow,
  PublicationRow,
  TemplateFileRow,
  TemplateRow,
} from "../data/dto";
import { isSupabaseConfigured, supabase } from "../supabase";
import {
  ensureWorkspaceMigrated,
  hasNormalizedWorkspaceData,
  isNormalizedSchemaAvailable,
  loadLegacyWorkspace,
  workspaceHasMeaningfulData,
} from "../workspace-migration";
import { requireSupabase, upsertRows } from "./db";

type LoadWorkspaceOptions = {
  skipAutoMigrate?: boolean;
};

export async function loadWorkspace(userId: string, options: LoadWorkspaceOptions = {}): Promise<AppState | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const schemaReady = await isNormalizedSchemaAvailable().catch(() => false);

  if (schemaReady && !options.skipAutoMigrate) {
    const hasNormalized = await hasNormalizedWorkspaceData(userId);
    if (!hasNormalized) {
      const legacy = await loadLegacyWorkspace(userId);
      if (workspaceHasMeaningfulData(legacy)) {
        await ensureWorkspaceMigrated(userId);
      }
    }
  }

  try {
    const normalized = await loadNormalizedWorkspace(userId);
    if (normalized) return normalized;
  } catch {
    // Fall back to legacy JSONB when normalized schema is unavailable.
  }

  const legacy = await loadLegacyWorkspace(userId);
  if (!legacy) return null;
  if (!workspaceHasMeaningfulData(legacy)) return null;
  return legacy;
}

export async function loadNormalizedWorkspace(userId: string): Promise<AppState | null> {
  const client = requireSupabase();

  const [
    profileResult,
    platformsResult,
    platformMetricsResult,
    goalsResult,
    ideasResult,
    publicationsResult,
    publicationFilesResult,
    channelsResult,
    checkpointsResult,
    templatesResult,
    templateFilesResult,
  ] = await Promise.all([
    client.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    client.from("platforms").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    client.from("platform_metrics").select("*").eq("user_id", userId).order("metric_date", { ascending: true }),
    client.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    client.from("ideas").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    client.from("publications").select("*").eq("user_id", userId).order("publication_date", { ascending: true }),
    client.from("publication_files").select("*").eq("user_id", userId),
    client.from("publication_channels").select("*").eq("user_id", userId),
    client.from("checkpoints").select("*").eq("user_id", userId).order("checkpoint_date", { ascending: true }),
    client.from("templates").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    client.from("template_files").select("*").eq("user_id", userId),
  ]);

  const results = [
    profileResult,
    platformsResult,
    platformMetricsResult,
    goalsResult,
    ideasResult,
    publicationsResult,
    publicationFilesResult,
    channelsResult,
    checkpointsResult,
    templatesResult,
    templateFilesResult,
  ];
  const firstError = results.find(result => result.error)?.error;
  if (firstError) throw classifyApiError(firstError);

  let referenceRows: CreatorReferenceRow[] = [];
  try {
    const referencesResult = await client
      .from("creator_references")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    referenceRows = referencesResult.error ? [] : (referencesResult.data ?? []) as CreatorReferenceRow[];
  } catch {
    referenceRows = [];
  }

  const hasData = Boolean(
    profileResult.data
    || platformsResult.data?.length
    || platformMetricsResult.data?.length
    || goalsResult.data?.length
    || ideasResult.data?.length
    || publicationsResult.data?.length
    || checkpointsResult.data?.length
    || templatesResult.data?.length
    || referenceRows.length,
  );
  if (!hasData) return null;

  const channelsByPublication = new Map<string, string>();
  for (const row of channelsResult.data ?? []) {
    if (!channelsByPublication.has(row.publication_id)) {
      channelsByPublication.set(row.publication_id, row.platform_id);
    }
  }

  const filesByPublication = mapPublicationFiles((publicationFilesResult.data ?? []) as PublicationFileRow[]);
  const filesByTemplate = mapTemplateFiles((templateFilesResult.data ?? []) as TemplateFileRow[]);
  const platforms = await Promise.all((platformsResult.data ?? []).map(row => mapPlatform(row as PlatformRow)));

  return {
    profile: mapProfile(profileResult.data as ProfileRow | null),
    platforms,
    platformMetrics: (platformMetricsResult.data ?? []).map(row => mapPlatformMetric(row as PlatformMetricRow)),
    goals: (goalsResult.data ?? []).map(row => mapGoal(row as GoalRow)),
    ideas: (ideasResult.data ?? []).map(row => mapIdea(row as IdeaRow)),
    publications: (publicationsResult.data ?? []).map(row => ({
      ...mapPublication(row as PublicationRow, channelsByPublication.get(row.id) ?? ""),
      files: filesByPublication.get(row.id) ?? [],
    })),
    checkpoints: (checkpointsResult.data ?? []).map(row => mapCheckpoint(row as CheckpointRow)),
    templates: (templatesResult.data ?? []).map(row =>
      mapTemplate(row as TemplateRow, filesByTemplate.get(row.id) ?? []),
    ),
    references: referenceRows.map(row => mapReference(row)),
  } as AppState;
}

/** Bulk save for migration, demo seed, and reset only. */
export async function saveFullWorkspace(userId: string, state: AppState): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) return;

  try {
    await saveNormalizedWorkspace(userId, state);
    return;
  } catch {
    // Legacy JSONB fallback for deployments without normalized schema.
  }

  const { error } = await supabase.from("user_workspaces").upsert(
    {
      user_id: userId,
      data: state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw classifyApiError(error);
}

async function saveNormalizedWorkspace(userId: string, state: AppState): Promise<void> {
  const client = requireSupabase();

  const profileResult = await client
    .from("profiles")
    .upsert(mapProfileForDb(userId, state.profile), { onConflict: "user_id" });
  if (profileResult.error) throw classifyApiError(profileResult.error);

  const platformRows = await Promise.all(state.platforms.map(platform => mapPlatformForDb(userId, platform)));
  await upsertRows("platforms", platformRows, ["user_id", "id"]);
  await deleteMissingRows("platforms", userId, state.platforms.map(platform => platform.id));

  await upsertRows(
    "platform_metrics",
    (state.platformMetrics ?? []).map(metric => mapPlatformMetricForDb(userId, metric)),
    ["user_id", "id"],
  );
  await deleteMissingRows("platform_metrics", userId, (state.platformMetrics ?? []).map(metric => metric.id));

  await upsertRows("goals", state.goals.map(goal => mapGoalForDb(userId, goal)), ["user_id", "id"]);
  await deleteMissingRows("goals", userId, state.goals.map(goal => goal.id));

  await upsertRows("ideas", state.ideas.map(idea => mapIdeaForDb(userId, idea)), ["user_id", "id"]);
  await deleteMissingRows("ideas", userId, state.ideas.map(idea => idea.id));

  await upsertRows(
    "publications",
    state.publications.map(publication => mapPublicationForDb(userId, publication)),
    ["user_id", "id"],
  );
  await deleteMissingRows("publications", userId, state.publications.map(publication => publication.id));

  const platformIds = new Set(state.platforms.map(platform => platform.id));
  const channels = state.publications
    .filter(publication => platformIds.has(publication.platformId))
    .map(publication => ({
      user_id: userId,
      publication_id: publication.id,
      platform_id: publication.platformId,
    }));
  const deleteChannelsResult = await client.from("publication_channels").delete().eq("user_id", userId);
  if (deleteChannelsResult.error) throw classifyApiError(deleteChannelsResult.error);
  await upsertRows("publication_channels", channels, ["user_id", "publication_id", "platform_id"]);

  await upsertRows(
    "checkpoints",
    state.checkpoints.map(checkpoint => mapCheckpointForDb(userId, checkpoint)),
    ["user_id", "id"],
  );
  await deleteMissingRows("checkpoints", userId, state.checkpoints.map(checkpoint => checkpoint.id));

  await upsertRows(
    "templates",
    state.templates.map(template => mapTemplateForDb(userId, template)),
    ["user_id", "id"],
  );
  await deleteMissingRows("templates", userId, state.templates.map(template => template.id));

  await upsertRows(
    "creator_references",
    (state.references ?? []).map(reference => mapReferenceForDb(userId, reference)),
    ["user_id", "id"],
  );
  await deleteMissingRows("creator_references", userId, (state.references ?? []).map(reference => reference.id));
}

async function deleteMissingRows(table: string, userId: string, ids: string[]) {
  const client = requireSupabase();
  let query = client.from(table).delete().eq("user_id", userId);
  if (ids.length > 0) {
    query = query.not("id", "in", `(${ids.map(quotePostgrestString).join(",")})`);
  }
  const { error } = await query;
  if (error) throw classifyApiError(error);
}

function quotePostgrestString(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
