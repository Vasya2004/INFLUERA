import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Idea, IdeaStatus, ContentFormat, Priority } from "@/lib/types";
import { CONTENT_FORMATS } from "@/lib/content-plan-utils";
import {
  IDEA_STATUSES,
  formatTagsInput,
  isIdeaInPlan,
  parseTagsInput,
} from "@/lib/ideas-utils";
import { IdeaCard } from "@/components/ideas/idea-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Lightbulb } from "lucide-react";
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
            <div className="space-y-1.5">
              <Label>Статус</Label>
              <Select value={form.status} onValueChange={value => set("status", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{IDEA_STATUSES.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
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
        const inPlan = isIdeaInPlan(state.publications, idea.id) || idea.status === "превращена в публикацию";

        if (idea.status === "архив" || inPlan) return false;
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
  }, [state.ideas, state.publications, search, priorityFilter, tagFilter]);

  function openAdd() {
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Идеи"
        action={
          <Button onClick={openAdd} data-testid="button-add-idea">
            <Plus className="mr-2 h-4 w-4" />Добавить идею
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/20 p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Поиск"
              value={search}
              onChange={event => setSearch(event.target.value)}
              data-testid="input-search-ideas"
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
          <Select value={priorityFilter} onValueChange={value => setPriorityFilter(value as Priority | "all")}>
            <SelectTrigger className="min-h-11 lg:w-[220px]">
              <SelectValue placeholder="Все приоритеты" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все приоритеты</SelectItem>
              {PRIORITIES.map(priority => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="min-h-11 lg:w-[220px]">
              <SelectValue placeholder="Все хэштеги" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все хэштеги</SelectItem>
              {availableTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {processedIdeas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={state.ideas.length === 0 ? "Пока нет идей" : "Здесь пусто"}
          description={
            state.ideas.length === 0
              ? "Собирайте гипотезы для контента. После переноса в контент-план идея уйдёт из активного списка."
              : "Идеи, отправленные в контент-план, больше не показываются на этой странице. Попробуйте изменить поиск или фильтры."
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
