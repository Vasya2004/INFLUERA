import {
  parsePublicationChecklist,
  serializePublicationChecklist,
} from "../content-plan-utils";
import type {
  Checkpoint,
  CreatorReference,
  Goal,
  Idea,
  IdeaScriptRow,
  Platform,
  PlatformMetric,
  Profile,
  Publication,
  Template,
} from "../types";
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
} from "./dto";
import { supabase } from "../supabase";

export function emptyProfile(): Profile {
  return {
    name: "",
    niche: "",
    positioning: "",
    description: "",
    targetAudience: "",
    mainTopics: "",
    rubrics: "",
    tone: "",
    expertise: "",
    opportunities: "",
  };
}

export async function mapProfile(row: ProfileRow | null): Promise<Profile> {
  if (!row) return emptyProfile();
  return {
    name: row.name ?? "",
    niche: row.niche ?? "",
    positioning: row.positioning ?? "",
    description: row.description ?? "",
    targetAudience: row.target_audience ?? "",
    mainTopics: row.main_topics ?? "",
    rubrics: row.rubrics ?? "",
    tone: row.tone ?? "",
    expertise: row.expertise ?? "",
    opportunities: row.opportunities ?? "",
    avatarUrl: row.avatar_url ?? await resolveStorageUrl("profile-assets", row.avatar_storage_path ?? null),
    avatarStoragePath: row.avatar_storage_path ?? undefined,
    coverUrl: row.cover_url ?? await resolveStorageUrl("profile-assets", row.cover_storage_path ?? null),
    coverStoragePath: row.cover_storage_path ?? undefined,
  };
}

export async function mapProfileForDb(userId: string, profile: Profile): Promise<ProfileRow> {
  const avatarStoragePath = profile.avatarUrl?.startsWith("data:")
    ? await uploadProfileAsset(userId, "avatar", profile.avatarUrl)
    : profile.avatarStoragePath ?? null;
  const coverStoragePath = profile.coverUrl?.startsWith("data:")
    ? await uploadProfileAsset(userId, "cover", profile.coverUrl)
    : profile.coverStoragePath ?? null;

  return {
    user_id: userId,
    name: profile.name,
    niche: profile.niche,
    positioning: profile.positioning,
    description: profile.description,
    target_audience: profile.targetAudience,
    main_topics: profile.mainTopics,
    rubrics: profile.rubrics,
    tone: profile.tone,
    expertise: profile.expertise,
    opportunities: profile.opportunities,
    avatar_url: avatarStoragePath || profile.avatarUrl?.startsWith("data:") ? null : profile.avatarUrl ?? null,
    avatar_storage_path: avatarStoragePath,
    cover_url: coverStoragePath || profile.coverUrl?.startsWith("data:") ? null : profile.coverUrl ?? null,
    cover_storage_path: coverStoragePath,
  };
}

export async function mapPlatform(row: PlatformRow): Promise<Platform> {
  return {
    id: row.id,
    name: row.name,
    username: row.username ?? "",
    url: row.url ?? "",
    subscribers: Number(row.subscribers ?? 0),
    targetSubscribers: Number(row.target_subscribers ?? 0),
    role: row.role as Platform["role"],
    weeklyPlan: Number(row.weekly_plan ?? 0),
    mirrorPlatformIds: row.mirror_platform_ids ?? undefined,
    accentColor: row.accent_color ?? undefined,
    iconUrl: row.icon_url ?? await resolveStorageUrl("platform-icons", row.icon_storage_path),
    iconStoragePath: row.icon_storage_path ?? undefined,
  };
}

export async function mapPlatformForDb(userId: string, platform: Platform): Promise<PlatformRow> {
  const iconStoragePath = platform.iconUrl?.startsWith("data:")
    ? await uploadPlatformIcon(userId, platform)
    : platform.iconStoragePath ?? null;

  return {
    id: platform.id,
    user_id: userId,
    name: platform.name,
    username: platform.username,
    url: platform.url,
    subscribers: platform.subscribers,
    target_subscribers: platform.targetSubscribers,
    role: platform.role,
    weekly_plan: platform.weeklyPlan,
    accent_color: platform.accentColor ?? null,
    icon_storage_path: iconStoragePath,
    icon_url: (iconStoragePath || platform.iconUrl?.startsWith("data:")) ? null : platform.iconUrl ?? null,
    mirror_platform_ids: platform.mirrorPlatformIds ?? [],
  };
}

export function mapPlatformMetric(row: PlatformMetricRow): PlatformMetric {
  return {
    id: row.id,
    platformId: row.platform_id,
    date: row.metric_date,
    subscribers: Number(row.subscribers ?? 0),
    notes: row.notes ?? undefined,
  };
}

export function mapPlatformMetricForDb(userId: string, metric: PlatformMetric): PlatformMetricRow {
  return {
    id: metric.id,
    user_id: userId,
    platform_id: metric.platformId,
    metric_date: metric.date.slice(0, 10),
    subscribers: metric.subscribers,
    notes: metric.notes ?? null,
  };
}

export function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    type: row.type as Goal["type"],
    currentValue: Number(row.current_value ?? 0),
    targetValue: Number(row.target_value ?? 0),
    deadline: row.deadline,
    platformId: row.platform_id ?? undefined,
    isPrimary: Boolean(row.is_primary),
  };
}

export function mapGoalForDb(userId: string, goal: Goal): GoalRow {
  return {
    id: goal.id,
    user_id: userId,
    title: goal.title,
    type: goal.type,
    current_value: goal.currentValue,
    target_value: goal.targetValue,
    deadline: goal.deadline,
    platform_id: goal.platformId ?? null,
    is_primary: Boolean(goal.isPrimary),
  };
}

export function mapIdea(row: IdeaRow): Idea {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    sourceUrl: row.source_url ?? undefined,
    script: row.script ?? undefined,
    storyboard: row.storyboard ?? undefined,
    scriptMode: row.script_mode === "post" ? "post" : row.script_mode === "video" ? "video" : undefined,
    scriptRows: parseIdeaScriptRows(row.script_rows),
    format: row.format as Idea["format"],
    platformId: row.platform_id ?? undefined,
    priority: row.priority as Idea["priority"],
    status: row.status as Idea["status"],
    createdAt: row.created_at,
    tags: row.tags ?? [],
  };
}

export function mapIdeaForDb(userId: string, idea: Idea): IdeaRow {
  return {
    id: idea.id,
    user_id: userId,
    title: idea.title,
    description: idea.description,
    source_url: idea.sourceUrl ?? null,
    script: idea.script ?? null,
    storyboard: idea.storyboard ?? null,
    script_mode: idea.scriptMode ?? null,
    script_rows: idea.scriptRows ?? [],
    format: idea.format,
    platform_id: idea.platformId ?? null,
    priority: idea.priority,
    status: idea.status,
    created_at: idea.createdAt,
    tags: idea.tags ?? [],
  };
}

function parseIdeaScriptRows(value: unknown): IdeaScriptRow[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows = value
    .map((item): IdeaScriptRow | null => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      return {
        id: typeof row.id === "string" ? row.id : Math.random().toString(36).slice(2, 9),
        text: typeof row.text === "string" ? row.text : "",
        storyboard: typeof row.storyboard === "string" ? row.storyboard : "",
      };
    })
    .filter((row): row is IdeaScriptRow => Boolean(row));

  return rows.length ? rows : undefined;
}

export function mapPublication(row: PublicationRow, platformId: string): Publication {
  const checklistData = parsePublicationChecklist(row.checklist ?? []);
  return {
    id: row.id,
    title: row.title,
    date: row.publication_date,
    platformId,
    format: row.format as Publication["format"],
    status: row.status as Publication["status"],
    ideaId: row.idea_id ?? undefined,
    note: row.note ?? undefined,
    url: row.url ?? undefined,
    hook: checklistData.hook,
    caption: checklistData.caption,
    cta: checklistData.cta,
    script: checklistData.script,
    storyboard: checklistData.storyboard,
    scriptMode: checklistData.scriptMode,
    scriptRows: checklistData.scriptRows,
    templateId: checklistData.templateId,
    checklist: checklistData.items,
  };
}

export function mapPublicationForDb(userId: string, publication: Publication): PublicationRow {
  return {
    id: publication.id,
    user_id: userId,
    title: publication.title,
    publication_date: publication.date,
    format: publication.format,
    status: publication.status,
    idea_id: publication.ideaId ?? null,
    note: publication.note ?? null,
    url: publication.url ?? null,
    checklist: serializePublicationChecklist(publication),
  };
}

export function mapCheckpoint(row: CheckpointRow): Checkpoint {
  return {
    id: row.id,
    type: row.type as Checkpoint["type"],
    date: row.checkpoint_date,
    note: row.note ?? undefined,
  };
}

export function mapCheckpointForDb(userId: string, checkpoint: Checkpoint): CheckpointRow {
  return {
    id: checkpoint.id,
    user_id: userId,
    type: checkpoint.type,
    checkpoint_date: checkpoint.date,
    note: checkpoint.note ?? null,
  };
}

export function mapTemplate(row: TemplateRow, files: NonNullable<Template["files"]>): Template {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Template["category"],
    format: (row.formats ?? []) as Template["format"],
    description: row.description,
    usage: String(row.usage ?? ""),
    content: row.content,
    files,
  };
}

export function mapTemplateForDb(userId: string, template: Template): TemplateRow {
  return {
    id: template.id,
    user_id: userId,
    name: template.name,
    category: template.category,
    formats: template.format,
    description: template.description,
    usage: template.usage,
    content: template.content,
  };
}

export function mapReference(row: CreatorReferenceRow): CreatorReference {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle ?? "",
    platform: row.platform ?? "",
    url: row.url ?? "",
    type: row.type as CreatorReference["type"],
    niche: row.niche ?? "",
    contentFocus: row.content_focus ?? "",
    whyRelevant: row.why_relevant ?? "",
    notes: row.notes ?? "",
    tags: row.tags ?? [],
    rating: Number(row.rating ?? 3),
    favorite: Boolean(row.favorite),
    createdAt: row.created_at,
  };
}

export function mapReferenceForDb(userId: string, reference: CreatorReference): CreatorReferenceRow {
  return {
    id: reference.id,
    user_id: userId,
    name: reference.name,
    handle: reference.handle || null,
    platform: reference.platform || null,
    url: reference.url || null,
    type: reference.type,
    niche: reference.niche || null,
    content_focus: reference.contentFocus || null,
    why_relevant: reference.whyRelevant || null,
    notes: reference.notes || null,
    tags: reference.tags ?? [],
    rating: reference.rating,
    favorite: Boolean(reference.favorite),
    created_at: reference.createdAt,
  };
}

export function mapTemplateFiles(rows: TemplateFileRow[]): Map<string, NonNullable<Template["files"]>> {
  const filesByTemplate = new Map<string, NonNullable<Template["files"]>>();
  for (const row of rows) {
    const files = filesByTemplate.get(row.template_id) ?? [];
    files.push({
      id: row.id,
      name: row.original_name,
      storagePath: row.storage_path,
      url: row.storage_path,
      mimeType: row.mime_type ?? undefined,
      sizeBytes: row.size_bytes ?? undefined,
      bucket: "template-files",
    });
    filesByTemplate.set(row.template_id, files);
  }
  return filesByTemplate;
}

export function mapPublicationFiles(rows: PublicationFileRow[]): Map<string, NonNullable<Publication["files"]>> {
  const filesByPublication = new Map<string, NonNullable<Publication["files"]>>();
  for (const row of rows) {
    const files = filesByPublication.get(row.publication_id) ?? [];
    files.push({
      id: row.id,
      name: row.original_name,
      storagePath: row.storage_path,
      url: row.storage_path,
      mimeType: row.mime_type ?? undefined,
      sizeBytes: row.size_bytes ?? undefined,
      bucket: "publication-files",
    });
    filesByPublication.set(row.publication_id, files);
  }
  return filesByPublication;
}

async function resolveStorageUrl(bucket: string, path: string | null): Promise<string | undefined> {
  if (!supabase || !path) return undefined;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return undefined;
  return data.signedUrl;
}

async function uploadPlatformIcon(userId: string, platform: Platform): Promise<string | null> {
  if (!supabase || !platform.iconUrl?.startsWith("data:")) return null;

  const response = await fetch(platform.iconUrl);
  const blob = await response.blob();
  const extension = mimeExtension(blob.type);
  const storagePath = `${userId}/${platform.id}.${extension}`;
  const { error } = await supabase.storage
    .from("platform-icons")
    .upload(storagePath, blob, {
      cacheControl: "3600",
      contentType: blob.type,
      upsert: true,
    });

  if (error) throw error;
  return storagePath;
}

async function uploadProfileAsset(userId: string, asset: "avatar" | "cover", dataUrl: string): Promise<string | null> {
  if (!supabase || !dataUrl.startsWith("data:")) return null;

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = mimeExtension(blob.type);
  const storagePath = `${userId}/${asset}.${extension}`;
  const { error } = await supabase.storage
    .from("profile-assets")
    .upload(storagePath, blob, {
      cacheControl: "3600",
      contentType: blob.type,
      upsert: true,
    });

  if (error) throw error;
  return storagePath;
}

function mimeExtension(mimeType: string) {
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/png") return "png";
  return "jpg";
}
