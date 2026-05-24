export const queryKeys = {
  workspace: (userId: string | undefined) => ["workspace", userId] as const,
  platforms: (userId: string | undefined) => ["platforms", userId] as const,
  platformMetrics: (userId: string | undefined) => ["platform-metrics", userId] as const,
  goals: (userId: string | undefined) => ["goals", userId] as const,
  ideas: (userId: string | undefined) => ["ideas", userId] as const,
  publications: (userId: string | undefined) => ["publications", userId] as const,
  checkpoints: (userId: string | undefined) => ["checkpoints", userId] as const,
  templates: (userId: string | undefined) => ["templates", userId] as const,
  profile: (userId: string | undefined) => ["profile", userId] as const,
  settings: (userId: string | undefined) => ["settings", userId] as const,
} as const;
