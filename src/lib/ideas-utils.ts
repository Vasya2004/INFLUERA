import type { Idea, IdeaStatus, Priority, Publication } from "./types";

export const IDEA_PIPELINE: IdeaStatus[] = [
  "новая",
  "сценарий",
  "монтаж",
  "опубликовано",
];

export const IDEA_STATUSES = IDEA_PIPELINE;

export const IDEA_KANBAN_COLUMNS = IDEA_PIPELINE;

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  "новая": "Новая",
  "сценарий": "Сценарий",
  "монтаж": "Монтаж",
  "опубликовано": "Опубликовано",
};

const LEGACY_IDEA_STATUS_MAP: Record<string, IdeaStatus> = {
  "в работе": "сценарий",
  "превращена в публикацию": "монтаж",
  "отложена": "новая",
  "архив": "опубликовано",
};

export function migrateIdeaStatus(status: string): IdeaStatus {
  if (IDEA_PIPELINE.includes(status as IdeaStatus)) {
    return status as IdeaStatus;
  }
  return LEGACY_IDEA_STATUS_MAP[status] ?? "новая";
}

export function getIdeaStatusIndex(status: IdeaStatus) {
  return IDEA_PIPELINE.indexOf(status);
}

export function getNextIdeaStatus(status: IdeaStatus): IdeaStatus | null {
  const index = getIdeaStatusIndex(status);
  if (index < 0 || index >= IDEA_PIPELINE.length - 1) return null;
  return IDEA_PIPELINE[index + 1] ?? null;
}

export type IdeaSortMode = "newest" | "priority" | "status" | "in_plan";

export type IdeaFilterState = {
  search: string;
  status: IdeaStatus | "все";
  priority: Priority | "все";
  platformId: string;
  format: string;
  inPlan: "все" | "в_плане" | "не_в_плане";
  hidePublished: boolean;
};

export type IdeasViewMode = "grid" | "kanban";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  "высокий": 0,
  "средний": 1,
  "низкий": 2,
};

const STATUS_WEIGHT: Record<IdeaStatus, number> = {
  "новая": 0,
  "сценарий": 1,
  "монтаж": 2,
  "опубликовано": 3,
};

export function getPublicationsForIdea(publications: Publication[], ideaId: string) {
  return publications.filter(publication => publication.ideaId === ideaId);
}

export function isIdeaInPlan(publications: Publication[], ideaId: string) {
  return getPublicationsForIdea(publications, ideaId).length > 0;
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(/[,;]+/)
    .map(tag => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 12);
}

export function formatTagsInput(tags: string[] | undefined) {
  return (tags ?? []).join(", ");
}

export function filterIdeas(
  ideas: Idea[],
  publications: Publication[],
  filters: IdeaFilterState,
): Idea[] {
  const query = filters.search.trim().toLowerCase();

  return ideas.filter(idea => {
    const normalizedStatus = migrateIdeaStatus(idea.status);
    if (filters.hidePublished && normalizedStatus === "опубликовано") return false;
    if (filters.status !== "все" && normalizedStatus !== filters.status) return false;
    if (filters.priority !== "все" && idea.priority !== filters.priority) return false;
    if (filters.platformId !== "все" && idea.platformId !== filters.platformId) return false;
    if (filters.format !== "все" && idea.format !== filters.format) return false;

    const inPlan = isIdeaInPlan(publications, idea.id);
    if (filters.inPlan === "в_плане" && !inPlan) return false;
    if (filters.inPlan === "не_в_плане" && inPlan) return false;

    if (!query) return true;

    const haystack = [
      idea.title,
      idea.description,
      ...(idea.tags ?? []),
    ].join(" ").toLowerCase();

    return haystack.includes(query);
  });
}

export function sortIdeas(
  ideas: Idea[],
  publications: Publication[],
  sortMode: IdeaSortMode,
): Idea[] {
  const sorted = [...ideas];

  sorted.sort((a, b) => {
    if (sortMode === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (sortMode === "priority") {
      const priorityDiff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (sortMode === "status") {
      const statusDiff = STATUS_WEIGHT[migrateIdeaStatus(a.status)] - STATUS_WEIGHT[migrateIdeaStatus(b.status)];
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    const aInPlan = isIdeaInPlan(publications, a.id);
    const bInPlan = isIdeaInPlan(publications, b.id);
    if (aInPlan !== bInPlan) return aInPlan ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return sorted;
}

export function groupIdeasByStatus(ideas: Idea[]) {
  const groups = new Map<IdeaStatus, Idea[]>();
  for (const status of IDEA_KANBAN_COLUMNS) {
    groups.set(status, []);
  }
  for (const idea of ideas) {
    const status = migrateIdeaStatus(idea.status);
    const bucket = groups.get(status);
    if (bucket) bucket.push({ ...idea, status });
  }
  return groups;
}
