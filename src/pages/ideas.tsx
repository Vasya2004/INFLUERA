import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Idea, IdeaStatus, ContentFormat, Priority } from "@/lib/types";
import { CONTENT_FORMATS } from "@/lib/content-plan-utils";
import {
  formatTagsInput,
  migrateIdeaStatus,
  parseTagsInput,
} from "@/lib/ideas-utils";
import { IdeaCard } from "@/components/ideas/idea-card";
import { IdeasFilters } from "@/components/ideas/ideas-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState, PageHeader } from "@/components/app/page";

const PRIORITIES: Priority[] = ["высокий", "средний", "низкий"];

function IdeaDialog({ open, onClose, idea, platforms }: {
  open: boolean;
  onClose: () => void;
  idea?: Idea;
  platforms: { id: string; name: string }[];
}) {
  const { addIdea, updateIdea } = useStore();
  const [form, setForm] = useState({
    title: "",
    description: "",
    sourceUrl: "",
    format: "пост" as ContentFormat,
    priority: "средний" as Priority,
    status: "новая" as IdeaStatus,
    platformId: "any",
    tags: "",
  });
  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setForm({
      title: idea?.title ?? "",
      description: idea?.description ?? "",
      sourceUrl: idea?.sourceUrl ?? "",
      format: idea?.format ?? "пост",
      priority: idea?.priority ?? "средний",
      status: idea?.status ?? "новая",
      platformId: idea?.platformId && platforms.some(platform => platform.id === idea.platformId) ? idea.platformId : "any",
      tags: formatTagsInput(idea?.tags),
    });
  }, [open, idea, platforms]);

  function handleSubmit() {
    if (!form.title) return;
    const data = {
      title: form.title,
      description: form.description,
      sourceUrl: form.sourceUrl.trim() || undefined,
      format: form.format,
      priority: form.priority,
      status: form.status,
      platformId: form.platformId === "any" ? undefined : form.platformId,
      tags: parseTagsInput(form.tags),
    };
    if (idea) updateIdea({ ...idea, ...data });
    else addIdea(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{idea ? "Редактировать идею" : "Новая идея"}</DialogTitle>
          <DialogDescription className="sr-only">Заполните поля идеи для бэклога контента.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Название</Label>
            <Input placeholder="Топ 5 ошибок начинающих..." value={form.title} onChange={e => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Описание</Label>
            <Textarea placeholder="Коротко — о чём идея" rows={3} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Хэштеги</Label>
            <Input placeholder="#съёмка, #telegram, #разбор" value={form.tags} onChange={e => set("tags", e.target.value)} />
            <p className="text-xs text-muted-foreground">Через запятую. Используются в поиске и фильтрации.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Ссылка</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={form.sourceUrl}
              onChange={e => set("sourceUrl", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Формат</Label>
              <Select value={form.format} onValueChange={value => set("format", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_FORMATS.map(format => <SelectItem key={format} value={format}>{format}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Платформа</Label>
              <Select value={form.platformId} onValueChange={value => set("platformId", value)}>
                <SelectTrigger><SelectValue placeholder="Любая" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Любая</SelectItem>
                  {platforms.map(platform => <SelectItem key={platform.id} value={platform.id}>{platform.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Приоритет</Label>
              <Select value={form.priority} onValueChange={value => set("priority", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(priority => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit}>{idea ? "Сохранить" : "Добавить идею"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Ideas() {
  const { state } = useStore();
  const mainPlatforms = useMemo(
    () => state.platforms.filter(platform => platform.role === "основная площадка"),
    [state.platforms],
  );
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const availableTags = useMemo(() => {
    return Array.from(
      new Set(
        state.ideas
          .flatMap(idea => idea.tags ?? [])
          .map(tag => tag.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "ru"));
  }, [state.ideas]);

  const processedIdeas = useMemo(() => {
    const query = search.trim().toLowerCase();

    return state.ideas
      .filter(idea => {
        const status = migrateIdeaStatus(idea.status);
        if (statusFilter === "all" && status === "опубликовано") return false;
        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (priorityFilter !== "all" && idea.priority !== priorityFilter) return false;
        if (tagFilter !== "all" && !(idea.tags ?? []).includes(tagFilter)) return false;

        if (!query) return true;
        return [
          idea.title,
          idea.description,
          ...(idea.tags ?? []),
        ].join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [state.ideas, search, priorityFilter, statusFilter, tagFilter]);

  function openAdd() {
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Идеи"
        action={
          <Button onClick={openAdd} className="w-full sm:w-auto" data-testid="button-add-idea">
            <Plus className="mr-2 h-4 w-4" />Добавить идею
          </Button>
        }
      />

      <IdeasFilters
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        availableTags={availableTags}
      />

      {processedIdeas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={state.ideas.length === 0 ? "Пока нет идей" : "Здесь пусто"}
          description={
            state.ideas.length === 0
              ? "Собирайте гипотезы для контента. После переноса в контент-план идея уйдёт из активного списка."
              : "Нет идей на выбранном этапе. Попробуйте изменить поиск или фильтры."
          }
          actionLabel={state.ideas.length === 0 ? "Добавить идею" : undefined}
          onAction={state.ideas.length === 0 ? openAdd : undefined}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {processedIdeas.map((idea, index) => (
              <motion.div
                key={idea.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ delay: index * 0.03 }}
                data-testid={`card-idea-${idea.id}`}
              >
                <IdeaCard
                  idea={idea}
                  platform={state.platforms.find(platform => platform.id === idea.platformId)}
                  publications={state.publications}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      <IdeaDialog open={dialogOpen} onClose={() => setDialogOpen(false)} platforms={mainPlatforms} />
    </div>
  );
}
