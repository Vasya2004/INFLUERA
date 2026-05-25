import type {
  Checkpoint,
  CheckpointType,
  ContentFormat,
  Publication,
  PublicationChecklistItem,
  PublicationStatus,
} from "./types";

export const CONTENT_FORMATS: ContentFormat[] = [
  "Reels/Shorts/TikTok",
  "пост",
  "карусель",
  "Telegram-пост",
  "видео",
  "сторис",
];

export function migrateContentFormat(format: string): ContentFormat {
  if (format === "лонгрид" || format === "другое") return "пост";
  return CONTENT_FORMATS.includes(format as ContentFormat)
    ? (format as ContentFormat)
    : "пост";
}

export const PUBLICATION_STATUSES: PublicationStatus[] = ["запланировано", "в работе", "готово", "опубликовано"];

const STATUS_MIGRATION: Record<string, PublicationStatus> = {
  "идея": "запланировано",
  "отложено": "запланировано",
  "в подготовке": "в работе",
  "готово": "готово",
  "запланировано": "запланировано",
  "в работе": "в работе",
  "опубликовано": "опубликовано",
};

/** Классы для бейджей статуса публикации в контент-плане и на главной */
export const PUBLICATION_STATUS_COLORS: Record<PublicationStatus, string> = {
  "запланировано": "bg-red-500/10 text-red-700 border-red-500/25 dark:text-red-300",
  "в работе": "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-300",
  "готово": "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-300",
  "опубликовано": "bg-emerald-500/15 text-emerald-700 border-emerald-500/35 dark:text-emerald-300",
};

export function migratePublicationStatus(status: string): PublicationStatus {
  return STATUS_MIGRATION[status] ?? "запланировано";
}

export const CHECKPOINT_TYPES: CheckpointType[] = [
  "обновление_подписчиков",
  "контент_план",
  "день_съемок",
];

export const CHECKPOINT_LABELS: Record<CheckpointType, string> = {
  "обновление_подписчиков": "Обновить подписчиков",
  "контент_план": "Составить контент-план",
  "день_съемок": "День съёмок",
};

export const CHECKPOINT_HINTS: Record<CheckpointType, string> = {
  "обновление_подписчиков": "1-е и 15-е число — раз в две недели",
  "контент_план": "28–30 число каждого месяца",
  "день_съемок": "Каждое воскресенье",
};

export const STATUS_LABELS: Record<PublicationStatus, string> = {
  "запланировано": "Запланировано",
  "в работе": "В работе",
  "готово": "Готово",
  "опубликовано": "Опубликовано",
};

export function nextSunday(from = new Date()): Date {
  const d = new Date(from);
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(12, 0, 0, 0);
  return d;
}

export const DEFAULT_PUBLICATION_CHECKLIST: PublicationChecklistItem[] = [
  { id: "hook", label: "Хук / заголовок готов", done: false },
  { id: "text", label: "Текст / подпись готовы", done: false },
  { id: "visual", label: "Визуал и формат проверены", done: false },
  { id: "cta", label: "CTA и ссылки добавлены", done: false },
  { id: "publish", label: "Опубликовано, ссылка сохранена", done: false },
];

export function parsePublicationChecklist(raw: unknown): {
  items: PublicationChecklistItem[];
  hook?: string;
  caption?: string;
  cta?: string;
  templateId?: string;
} {
  if (Array.isArray(raw)) {
    return { items: raw as PublicationChecklistItem[] };
  }

  if (raw && typeof raw === "object") {
    const value = raw as Record<string, unknown>;
    const items = Array.isArray(value.items)
      ? (value.items as PublicationChecklistItem[])
      : DEFAULT_PUBLICATION_CHECKLIST.map(item => ({ ...item }));

    return {
      items,
      hook: typeof value.hook === "string" ? value.hook : undefined,
      caption: typeof value.caption === "string" ? value.caption : undefined,
      cta: typeof value.cta === "string" ? value.cta : undefined,
      templateId: typeof value.templateId === "string" ? value.templateId : undefined,
    };
  }

  return { items: DEFAULT_PUBLICATION_CHECKLIST.map(item => ({ ...item })) };
}

export function serializePublicationChecklist(publication: Publication) {
  return {
    items: publication.checklist ?? DEFAULT_PUBLICATION_CHECKLIST,
    hook: publication.hook || undefined,
    caption: publication.caption || undefined,
    cta: publication.cta || undefined,
    templateId: publication.templateId || undefined,
  };
}

export function ensurePublicationChecklist(publication: Publication): Publication {
  if (publication.checklist?.length) return publication;
  return { ...publication, checklist: DEFAULT_PUBLICATION_CHECKLIST.map(item => ({ ...item })) };
}

export function isPublicationOverdue(publication: Publication, now = new Date()) {
  if (publication.status === "опубликовано") return false;
  const date = new Date(publication.date);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

export function publicationProgress(publication: Publication) {
  const items = publication.checklist ?? [];
  if (!items.length) return 0;
  const done = items.filter(item => item.done).length;
  return Math.round((done / items.length) * 100);
}

export function getAdjacentPublicationStatus(
  status: PublicationStatus,
  direction: "next" | "prev",
): PublicationStatus | null {
  const index = PUBLICATION_STATUSES.indexOf(status);
  if (index < 0) return null;
  const nextIndex = direction === "next" ? index + 1 : index - 1;
  return PUBLICATION_STATUSES[nextIndex] ?? null;
}

export type PlanEntry =
  | { kind: "publication"; data: Publication }
  | { kind: "checkpoint"; data: Checkpoint };

export type PlanFilter = PublicationStatus | "чекпоинт" | "все";

export type ContentPlanFilterState = {
  status: PlanFilter;
  platformId: string;
  format: ContentFormat | "все";
  ideaFilter: "все" | "с_идеей" | "без_идеи";
  overdueOnly: boolean;
  missingUrlOnly: boolean;
  missingNoteOnly: boolean;
};

export function filterPlanEntries(entries: PlanEntry[], filters: ContentPlanFilterState): PlanEntry[] {
  return entries.filter(entry => {
    if (filters.status !== "все") {
      if (filters.status === "чекпоинт") {
        if (entry.kind !== "checkpoint") return false;
      } else if (entry.kind !== "publication" || entry.data.status !== filters.status) {
        return false;
      }
    }

    if (filters.platformId !== "все") {
      if (entry.kind !== "publication" || entry.data.platformId !== filters.platformId) return false;
    }

    if (filters.format !== "все") {
      if (entry.kind !== "publication" || entry.data.format !== filters.format) return false;
    }

    if (filters.ideaFilter === "с_идеей") {
      if (entry.kind !== "publication" || !entry.data.ideaId) return false;
    }
    if (filters.ideaFilter === "без_идеи") {
      if (entry.kind !== "publication" || entry.data.ideaId) return false;
    }

    if (filters.overdueOnly) {
      if (entry.kind !== "publication" || !isPublicationOverdue(entry.data)) return false;
    }

    if (filters.missingUrlOnly) {
      if (entry.kind !== "publication" || entry.data.url?.trim()) return false;
    }

    if (filters.missingNoteOnly) {
      if (entry.kind !== "publication" || entry.data.note?.trim()) return false;
    }

    return true;
  });
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function startOfWeekMonday(date: Date) {
  const next = startOfDay(date);
  const offset = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - offset);
  return next;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function buildCalendarDays(cursor: Date, view: "month" | "week"): Date[] {
  if (view === "week") {
    const start = startOfWeekMonday(cursor);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const gridStart = startOfWeekMonday(monthStart);
  const gridEnd = addDays(startOfWeekMonday(monthEnd), 6);
  const days: Date[] = [];
  for (let day = new Date(gridStart); day <= gridEnd; day = addDays(day, 1)) {
    days.push(new Date(day));
  }
  return days;
}

export function isViewingCurrentPeriod(cursor: Date, view: "month" | "week", now = new Date()) {
  if (view === "month") {
    return cursor.getMonth() === now.getMonth() && cursor.getFullYear() === now.getFullYear();
  }
  return toDateKey(startOfWeekMonday(cursor)) === toDateKey(startOfWeekMonday(now));
}

export function formatPlanPeriodLabel(cursor: Date, view: "month" | "week" | "list") {
  if (view === "list") return "Все даты";
  if (view === "week") {
    const start = startOfWeekMonday(cursor);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = start.toLocaleDateString("ru-RU", { day: "numeric", month: sameMonth ? undefined : "short" });
    const endLabel = end.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
    return `${startLabel} — ${endLabel}`;
  }
  return cursor.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

export function isSameMonth(day: Date, cursor: Date) {
  return day.getMonth() === cursor.getMonth() && day.getFullYear() === cursor.getFullYear();
}

export function toDateKey(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toISOString().slice(0, 10);
}
