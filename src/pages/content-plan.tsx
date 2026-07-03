import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Checkpoint, CheckpointType, ContentFormat, Publication } from "@/lib/types";
import {
  CHECKPOINT_LABELS,
  CHECKPOINT_TYPES,
  CONTENT_FORMATS,
  PUBLICATION_STATUS_COLORS,
  STATUS_LABELS,
  type ContentPlanFilterState,
  type PlanEntry,
  type PlanFilter,
  buildCalendarDays,
  filterPlanEntries,
  formatPlanPeriodLabel,
  isPublicationOverdue,
  isSameMonth,
  isViewingCurrentPeriod,
  toDateKey,
  addDays,
  addMonths,
  startOfDay,
} from "@/lib/content-plan-utils";
import { PublicationFormDialog } from "@/components/content-plan/publication-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CalendarDays, Pencil, Trash2, ExternalLink, Flag, List, Rows3, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import { EmptyState, PageHeader } from "@/components/app/page";
import { cn } from "@/lib/utils";
import { PlatformAvatar } from "@/components/app/platform-avatar";

type PlanView = "month" | "week" | "list";

const FILTER_OPTIONS: { label: string; value: PlanFilter }[] = [
  { label: "Все", value: "все" },
  { label: "Запланировано", value: "запланировано" },
  { label: "В работе", value: "в работе" },
  { label: "Готово", value: "готово" },
  { label: "Опубликовано", value: "опубликовано" },
  { label: "Чекпоинты", value: "чекпоинт" },
];

const VIEW_OPTIONS: { label: string; value: PlanView; icon: typeof CalendarDays }[] = [
  { label: "Месяц", value: "month", icon: CalendarDays },
  { label: "Неделя", value: "week", icon: Rows3 },
  { label: "Список", value: "list", icon: List },
];

const DEFAULT_FILTERS: ContentPlanFilterState = {
  status: "все",
  platformId: "все",
  format: "все",
  ideaFilter: "все",
  overdueOnly: false,
  missingUrlOnly: false,
  missingNoteOnly: false,
};

function CheckpointDialog({ open, onClose, checkpoint }: {
  open: boolean;
  onClose: () => void;
  checkpoint?: Checkpoint;
}) {
  const { addCheckpoint, updateCheckpoint } = useStore();
  const [form, setForm] = useState({
    type: (checkpoint?.type ?? "обновление_подписчиков") as CheckpointType,
    date: checkpoint?.date ? checkpoint.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (open) {
      setForm({
        type: (checkpoint?.type ?? "обновление_подписчиков") as CheckpointType,
        date: checkpoint?.date ? checkpoint.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, checkpoint]);

  function handleSubmit() {
    const data = {
      type: form.type,
      date: new Date(form.date).toISOString(),
      note: undefined,
    };
    if (checkpoint) updateCheckpoint({ ...checkpoint, ...data });
    else addCheckpoint(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{checkpoint ? "Редактировать чекпоинт" : "Добавить чекпоинт"}</DialogTitle>
          <DialogDescription className="sr-only">Регулярная операционная задача в контент-плане.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Тип чекпоинта</Label>
            <Select value={form.type} onValueChange={value => setForm(current => ({ ...current, type: value as CheckpointType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHECKPOINT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{CHECKPOINT_LABELS[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Дата</Label>
            <Input type="date" value={form.date} onChange={e => setForm(current => ({ ...current, date: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit}>{checkpoint ? "Сохранить" : "Добавить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DateBadge({ date, inverted }: { date: Date; inverted?: boolean }) {
  return (
    <div className={cn(
      "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border shadow-sm",
      inverted ? "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground" : "border-border/70 bg-secondary text-secondary-foreground",
    )}>
      <span className="text-xs font-medium uppercase">{date.toLocaleString("ru-RU", { month: "short" })}</span>
      <span className="mt-0.5 text-xl font-bold leading-none">{date.getDate()}</span>
    </div>
  );
}

function DatePlatformBadges({ date, platform }: { date: Date; platform?: { name: string; iconUrl?: string; accentColor?: string } }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <DateBadge date={date} />
      {platform && <PlatformAvatar platform={platform} size="lg" />}
    </div>
  );
}

function isPublishedPublication(publication: Publication) {
  return publication.status === "опубликовано";
}

function publicationCalendarCardClass(publication: Publication, overdue: boolean) {
  if (isPublishedPublication(publication)) {
    return "border-emerald-500/45 bg-emerald-500/15 text-emerald-950 shadow-[0_0_24px_hsl(160_84%_39%/0.14)] hover:border-emerald-500/65 hover:bg-emerald-500/20 dark:border-emerald-400/45 dark:text-emerald-50 dark:hover:border-emerald-300/65";
  }

  return overdue
    ? "border-destructive/40 bg-destructive/5"
    : "border-border/70 bg-background";
}

function publicationListCardClass(publication: Publication) {
  return isPublishedPublication(publication)
    ? "border-emerald-400/45 bg-emerald-500/10 shadow-[0_0_30px_hsl(160_84%_39%/0.12)]"
    : "border-border/80";
}

function getInitialPlanView(): PlanView {
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
    return "list";
  }
  return "month";
}

export default function ContentPlan() {
  const { state, deletePublication, deleteCheckpoint } = useStore();
  const [, setLocation] = useLocation();
  const [cursorDate, setCursorDate] = useState(() => startOfDay(new Date()));
  const [filters, setFilters] = useState<ContentPlanFilterState>(DEFAULT_FILTERS);
  const [view, setView] = useState<PlanView>(getInitialPlanView);
  const [pubDialogOpen, setPubDialogOpen] = useState(false);
  const [pubDialogDate, setPubDialogDate] = useState<string | undefined>();
  const [checkpointDialogOpen, setCheckpointDialogOpen] = useState(false);
  const [editPub, setEditPub] = useState<Publication | undefined>();
  const [editCheckpoint, setEditCheckpoint] = useState<Checkpoint | undefined>();
  const [deletePubId, setDeletePubId] = useState<string | null>(null);
  const [deleteCheckpointId, setDeleteCheckpointId] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const syncMobileView = () => {
      if (media.matches) setView("list");
    };

    syncMobileView();
    media.addEventListener("change", syncMobileView);
    return () => media.removeEventListener("change", syncMobileView);
  }, []);

  const entries = useMemo<PlanEntry[]>(() => {
    const pubs: PlanEntry[] = state.publications.map(publication => ({ kind: "publication", data: publication }));
    const checks: PlanEntry[] = (state.checkpoints ?? []).map(checkpoint => ({ kind: "checkpoint", data: checkpoint }));
    return [...pubs, ...checks].sort(
      (a, b) => new Date(a.data.date).getTime() - new Date(b.data.date).getTime(),
    );
  }, [state.publications, state.checkpoints]);

  const filtered = useMemo(() => filterPlanEntries(entries, filters), [entries, filters]);
  const listEntries = useMemo(
    () => filtered.filter(entry => isSameMonth(new Date(entry.data.date), cursorDate)),
    [filtered, cursorDate],
  );

  const calendarDays = useMemo(
    () => (view === "list" ? [] : buildCalendarDays(cursorDate, view)),
    [cursorDate, view],
  );

  const calendarEntriesByDate = useMemo(() => {
    const map = new Map<string, PlanEntry[]>();
    for (const entry of filtered) {
      const key = toDateKey(entry.data.date);
      const bucket = map.get(key) ?? [];
      bucket.push(entry);
      map.set(key, bucket);
    }
    for (const [key, dayEntries] of map) {
      dayEntries.sort((a, b) => {
        if (a.kind !== b.kind) return a.kind === "checkpoint" ? -1 : 1;
        return new Date(a.data.date).getTime() - new Date(b.data.date).getTime();
      });
      map.set(key, dayEntries);
    }
    return map;
  }, [filtered]);

  const showTodayButton = !isViewingCurrentPeriod(cursorDate, view);

  const activeAdvancedFilters = filters.format !== "все"
    || filters.ideaFilter !== "все"
    || filters.overdueOnly
    || filters.missingUrlOnly
    || filters.missingNoteOnly;

  function openAddPub(date?: string) {
    setEditPub(undefined);
    setPubDialogDate(date);
    setPubDialogOpen(true);
  }

  function openPublicationTarget(publication: Publication) {
    setLocation(`/app/content-plan/${publication.id}`);
  }

  function shiftPeriod(direction: -1 | 1) {
    if (view === "month" || view === "list") setCursorDate(current => addMonths(current, direction));
    else if (view === "week") setCursorDate(current => addDays(current, direction * 7));
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Контент-план"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setEditCheckpoint(undefined); setCheckpointDialogOpen(true); }}>
              <Flag className="mr-2 h-4 w-4" />Чекпоинт
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => openAddPub()}>
              <Plus className="mr-2 h-4 w-4" />Запланировать
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="flex w-full items-center rounded-xl border border-border/80 bg-background/90 p-1 shadow-sm sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => shiftPeriod(-1)}
              aria-label={view === "week" ? "Предыдущая неделя" : "Предыдущий месяц"}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1 px-3 text-center sm:min-w-[11rem]">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {view === "week" ? "Неделя" : "Месяц"}
              </p>
              <p className="text-sm font-semibold capitalize leading-tight">
                {formatPlanPeriodLabel(cursorDate, view)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => shiftPeriod(1)}
              aria-label={view === "week" ? "Следующая неделя" : "Следующий месяц"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {showTodayButton && (
            <Button
              type="button"
              variant="outline"
              className="min-h-9 rounded-xl px-3 text-xs"
              onClick={() => setCursorDate(startOfDay(new Date()))}
            >
              Перейти к сегодня
            </Button>
          )}
        </div>
        <div className="grid w-full grid-cols-3 rounded-2xl border border-border/80 bg-background/80 p-1 shadow-sm sm:w-auto">
          {VIEW_OPTIONS.map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setView(option.value)}
                className={cn(
                  "inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-all sm:px-3.5",
                  view === option.value ? "bg-background text-foreground shadow-sm ring-1 ring-border/70" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
          {FILTER_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilters(current => ({ ...current, status: option.value }))}
              className={cn(
                "min-h-9 shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all",
                filters.status === option.value
                  ? "border-primary/30 bg-primary text-primary-foreground"
                  : "border-border/70 bg-secondary/80 text-secondary-foreground hover:bg-secondary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Select value={filters.platformId} onValueChange={value => setFilters(current => ({ ...current, platformId: value }))}>
          <SelectTrigger className="min-h-10 w-full rounded-xl sm:w-auto sm:min-w-40">
            <SelectValue placeholder="Платформа" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="все">Все платформы</SelectItem>
            {state.platforms.map(platform => (
              <SelectItem key={platform.id} value={platform.id}>{platform.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("min-h-10 w-full rounded-xl sm:w-auto", activeAdvancedFilters && "border-primary/40 bg-primary/5")}>
              <Filter className="mr-2 h-4 w-4" />
              Фильтры
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-4" align="end">
            <div className="space-y-1.5">
              <Label>Формат</Label>
              <Select value={filters.format} onValueChange={value => setFilters(current => ({ ...current, format: value as ContentFormat | "все" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="все">Все форматы</SelectItem>
                  {CONTENT_FORMATS.map(format => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Идея</Label>
              <Select value={filters.ideaFilter} onValueChange={value => setFilters(current => ({ ...current, ideaFilter: value as ContentPlanFilterState["ideaFilter"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="все">Все</SelectItem>
                  <SelectItem value="с_идеей">Связаны с идеей</SelectItem>
                  <SelectItem value="без_идеи">Без идеи</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={filters.overdueOnly} onCheckedChange={value => setFilters(current => ({ ...current, overdueOnly: value === true }))} />
                Только просроченные
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={filters.missingUrlOnly} onCheckedChange={value => setFilters(current => ({ ...current, missingUrlOnly: value === true }))} />
                Без ссылки (опубликованные)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={filters.missingNoteOnly} onCheckedChange={value => setFilters(current => ({ ...current, missingNoteOnly: value === true }))} />
                Без заметки
              </label>
            </div>
            {activeAdvancedFilters && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setFilters(current => ({
                ...current,
                format: "все",
                ideaFilter: "все",
                overdueOnly: false,
                missingUrlOnly: false,
                missingNoteOnly: false,
              }))}>
                <X className="mr-2 h-4 w-4" />
                Сбросить доп. фильтры
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {view !== "list" && (
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border/80 bg-muted/35 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map(day => (
                <div key={day} className="px-2 py-2.5">{day}</div>
              ))}
            </div>
            <div className={cn("grid grid-cols-7", view === "week" ? "min-h-[280px]" : "min-h-[520px]")}>
              {calendarDays.map(day => {
                const key = toDateKey(day);
                const dayEntries = calendarEntriesByDate.get(key) ?? [];
                const maxVisible = view === "week" ? 6 : 3;
                const visibleEntries = dayEntries.slice(0, maxVisible);
                const hiddenCount = Math.max(0, dayEntries.length - maxVisible);
                const isToday = toDateKey(day) === toDateKey(new Date());
                const inCurrentMonth = view === "month" ? isSameMonth(day, cursorDate) : true;
                return (
                  <div
                    key={key}
                    className={cn(
                      "group min-h-28 border-b border-r border-border/60 p-2 transition-colors hover:bg-muted/25",
                      !inCurrentMonth && "bg-muted/15 text-muted-foreground",
                      isToday && "bg-primary/[0.04]",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-1">
                      <span className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                        isToday ? "bg-primary text-primary-foreground" : "",
                      )}>
                        {day.getDate()}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {dayEntries.length > 0 && (
                          <span className="rounded-full border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {dayEntries.length}
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          onClick={() => openAddPub(key)}
                          aria-label={`Запланировать на ${key}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {visibleEntries.map(entry => {
                        if (entry.kind === "checkpoint") {
                          const checkpoint = entry.data;
                          return (
                            <button
                              key={checkpoint.id}
                              type="button"
                              onClick={() => {
                                setEditCheckpoint(checkpoint);
                                setCheckpointDialogOpen(true);
                              }}
                              className="flex w-full items-start gap-1.5 rounded-lg border border-primary/40 bg-primary px-2 py-1.5 text-left text-[11px] text-primary-foreground shadow-sm transition-all hover:brightness-110"
                            >
                              <Flag className="mt-0.5 h-3 w-3 shrink-0 opacity-90" />
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{CHECKPOINT_LABELS[checkpoint.type]}</span>
                                <span className="mt-0.5 block truncate opacity-80">Чекпоинт</span>
                              </span>
                            </button>
                          );
                        }

                        const pub = entry.data;
                        const platform = state.platforms.find(item => item.id === pub.platformId);
                        const overdue = isPublicationOverdue(pub);
                        return (
                          <button
                            key={pub.id}
                            type="button"
                            onClick={() => openPublicationTarget(pub)}
                            className={cn(
                              "w-full rounded-lg border px-2 py-1.5 text-left text-[11px] shadow-sm transition-all hover:border-primary/35 hover:bg-primary/5",
                              publicationCalendarCardClass(pub, overdue),
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-1.5">
                              {platform && <PlatformAvatar platform={platform} size="xs" />}
                              <span className="block min-w-0 truncate font-medium">{pub.title}</span>
                            </span>
                            <span className={cn(
                              "mt-0.5 block truncate",
                              isPublishedPublication(pub) ? "text-emerald-800/85 dark:text-emerald-100/80" : "text-muted-foreground",
                            )}>
                              {platform?.name ?? "—"} · {STATUS_LABELS[pub.status]}
                            </span>
                          </button>
                        );
                      })}
                      {hiddenCount > 0 && (
                        <p className="px-1 text-[11px] text-muted-foreground">+ ещё {hiddenCount}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {view === "list" && listEntries.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Пусто"
          description="В выбранном месяце нет публикаций или чекпоинтов."
          actionLabel="Запланировать"
          onAction={() => openAddPub()}
        />
      ) : view === "list" ? (
        <div className="space-y-2">
          {listEntries.map((entry, index) => {
            const entryDate = new Date(entry.data.date);
            const isToday = toDateKey(entryDate) === toDateKey(new Date());
            const isPast = entryDate < new Date() && !isToday;

            if (entry.kind === "checkpoint") {
              const checkpoint = entry.data;
              return (
                <motion.div key={checkpoint.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                  <Card
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer border-primary/35 bg-primary text-primary-foreground transition-transform active:scale-[0.99]"
                    onClick={() => { setEditCheckpoint(checkpoint); setCheckpointDialogOpen(true); }}
                    onKeyDown={event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setEditCheckpoint(checkpoint);
                        setCheckpointDialogOpen(true);
                      }
                    }}
                  >
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <DateBadge date={entryDate} inverted />
                        <div>
                          <p className="text-sm font-semibold">{CHECKPOINT_LABELS[checkpoint.type]}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden text-primary-foreground hover:bg-primary-foreground/15 sm:inline-flex"
                          onClick={event => {
                            event.stopPropagation();
                            setEditCheckpoint(checkpoint);
                            setCheckpointDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary-foreground hover:bg-primary-foreground/15"
                          onClick={event => {
                            event.stopPropagation();
                            setDeleteCheckpointId(checkpoint.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            }

            const publication = entry.data;
            const platform = state.platforms.find(item => item.id === publication.platformId);

            return (
              <motion.div key={publication.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                <Card
                  role="button"
                  tabIndex={0}
                  className={cn("group cursor-pointer shadow-sm transition-transform active:scale-[0.99]", publicationListCardClass(publication), isPast && publication.status !== "опубликовано" && "opacity-85")}
                  onClick={() => openPublicationTarget(publication)}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openPublicationTarget(publication);
                    }
                  }}
                >
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex min-w-0 items-center gap-4">
                        <DatePlatformBadges date={entryDate} platform={platform} />
                        <div className="min-w-0">
                          <p className="truncate text-left text-sm font-semibold">
                            {publication.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge variant="outline">{publication.format}</Badge>
                            {isPublicationOverdue(publication) && <Badge variant="destructive">Просрочено</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("inline-flex min-h-8 items-center rounded-full border px-2.5 py-1 text-xs font-semibold", PUBLICATION_STATUS_COLORS[publication.status])}>
                        {STATUS_LABELS[publication.status]}
                      </span>
                      {publication.url && (
                        <a
                          href={publication.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-primary"
                          onClick={event => event.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden h-9 w-9 sm:inline-flex"
                        onClick={event => {
                          event.stopPropagation();
                          openPublicationTarget(publication);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={event => {
                          event.stopPropagation();
                          setDeletePubId(publication.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : null}

      <PublicationFormDialog
        open={pubDialogOpen}
        onClose={() => setPubDialogOpen(false)}
        pub={editPub}
        initialDate={pubDialogDate}
        platforms={state.platforms}
        ideas={state.ideas}
        templates={state.templates}
      />
      <CheckpointDialog open={checkpointDialogOpen} onClose={() => setCheckpointDialogOpen(false)} checkpoint={editCheckpoint} />

      <AlertDialog open={!!deletePubId} onOpenChange={() => setDeletePubId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить публикацию?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deletePublication(deletePubId!); setDeletePubId(null); }}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCheckpointId} onOpenChange={() => setDeleteCheckpointId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить чекпоинт?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteCheckpoint(deleteCheckpointId!); setDeleteCheckpointId(null); }}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
