import { z } from "zod";
import type { AppState } from "./types";

const optionalString = z.string().optional();

const platformSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  url: z.string(),
  subscribers: z.number(),
  targetSubscribers: z.number(),
  role: z.string(),
  weeklyPlan: z.number(),
  mirrorPlatformIds: z.array(z.string()).optional(),
  accentColor: optionalString,
  iconUrl: optionalString,
  iconStoragePath: optionalString,
});

const platformMetricSchema = z.object({
  id: z.string(),
  platformId: z.string(),
  date: z.string(),
  subscribers: z.number(),
  notes: optionalString,
});

const goalSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  currentValue: z.number(),
  targetValue: z.number(),
  deadline: z.string(),
  platformId: optionalString,
  isPrimary: z.boolean().optional(),
});

const ideaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  format: z.string(),
  platformId: optionalString,
  priority: z.string(),
  status: z.string(),
  createdAt: z.string(),
  tags: z.array(z.string()).optional(),
});

const publicationChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  done: z.boolean(),
});

const publicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  platformId: z.string(),
  format: z.string(),
  status: z.string(),
  ideaId: optionalString,
  note: optionalString,
  url: optionalString,
  hook: optionalString,
  caption: optionalString,
  cta: optionalString,
  templateId: optionalString,
  checklist: z.array(publicationChecklistItemSchema).optional(),
});

const checkpointSchema = z.object({
  id: z.string(),
  type: z.string(),
  date: z.string(),
  note: optionalString,
});

const templateFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  mimeType: optionalString,
});

const templateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  format: z.array(z.string()),
  description: z.string(),
  usage: z.string(),
  content: z.string(),
  files: z.array(templateFileSchema).optional(),
});

const profileSchema = z.object({
  name: z.string(),
  niche: z.string(),
  positioning: z.string(),
  description: z.string(),
  targetAudience: z.string(),
  mainTopics: z.string(),
  rubrics: z.string(),
  tone: z.string(),
  expertise: z.string(),
  opportunities: z.string(),
});

const appStateSchema = z.object({
  platforms: z.array(platformSchema),
  platformMetrics: z.array(platformMetricSchema).optional().default([]),
  goals: z.array(goalSchema),
  ideas: z.array(ideaSchema),
  publications: z.array(publicationSchema),
  checkpoints: z.array(checkpointSchema).optional().default([]),
  templates: z.array(templateSchema),
  profile: profileSchema,
});

export function parseAppState(raw: unknown): AppState | null {
  const parsed = appStateSchema.safeParse(raw);
  return parsed.success ? (parsed.data as AppState) : null;
}
