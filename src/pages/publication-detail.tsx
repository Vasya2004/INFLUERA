import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import type { ContentFormat, IdeaScriptMode, IdeaScriptRow, Publication, PublicationStatus } from "@/lib/types";
import { useStore } from "@/lib/store";
import {
  CONTENT_FORMATS,
  DEFAULT_PUBLICATION_CHECKLIST,
  PUBLICATION_STATUSES,
  PUBLICATION_STATUS_COLORS,
  STATUS_LABELS,
  ensurePublicationChecklist,
  isPublicationOverdue,
} from "@/lib/content-plan-utils";
import { EmptyState, PageHeader } from "@/components/app/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, CalendarDays, ExternalLink, FileText, Lightbulb, Plus, Save, Trash2 } from "lucide-react";
import { PlatformAvatar } from "@/components/app/platform-avatar";

function toDateInputValue(date: string) {
  return date.slice(0, 10);
}

function createScriptRow(row?: Partial<IdeaScriptRow>): IdeaScriptRow {
  return {
    id: row?.id ?? Math.random().toString(36).slice(2, 9),
    text: row?.text ?? "",
    storyboard: row?.storyboard ?? "",
  };
}

function rowsFromLegacyFields(script?: string, storyboard?: string, caption?: string): IdeaScriptRow[] {
  const scriptParts = (script || caption || "").split(/\n{2,}/);
  const storyboardParts = (storyboard ?? "").split(/\n{2,}/);
  const count = Math.max(scriptParts.filter(Boolean).length, storyboardParts.filter(Boolean).length, 1);

  return Array.from({ length: count }, (_, index) => createScriptRow({
    text: scriptParts[index]?.trim() ?? "",
    storyboard: storyboardParts[index]?.trim() ?? "",
  }));
}

function inferScriptMode(format: ContentFormat, storyboard?: string, rows?: IdeaScriptRow[]): IdeaScriptMode {
  if (storyboard?.trim() || rows?.some(row => row.storyboard.trim())) return "video";
  return format === "пост" || format === "Telegram-пост" || format === "карусель" ? "post" : "video";
}

export default function PublicationDetail() {
  const [, params] = useRoute("/content-plan/:id");
  const [, setLocation] = useLocation();
  const { state, updatePublication, deletePublication } = useStore();
  const { toast } = useToast();
  const publication = state.publications.find(item => item.id === params?.id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    platformId: "",
    format: "пост" as ContentFormat,
    status: "запланировано" as PublicationStatus,
    ideaId: "none",
    note: "",
    url: "",
    hook: "",
    caption: "",
    postText: "",
    cta: "",
    script: "",
    storyboard: "",
    scriptRows: [createScriptRow()],
    scriptMode: "post" as IdeaScriptMode,
    templateId: "none",
    checklist: DEFAULT_PUBLICATION_CHECKLIST.map(item => ({ ...item })),
  });

  const enrichedPublication = useMemo(
    () => publication ? ensurePublicationChecklist(publication) : undefined,
    [publication],
  );
  const mainPlatforms = useMemo(
    () => state.platforms.filter(item => item.role === "основная площадка"),
    [state.platforms],
  );

  useEffect(() => {
    if (!enrichedPublication) return;
    setForm({
      title: enrichedPublication.title,
      date: toDateInputValue(enrichedPublication.date),
      platformId: mainPlatforms.some(item => item.id === enrichedPublication.platformId)
        ? enrichedPublication.platformId
        : mainPlatforms[0]?.id ?? "",
      format: enrichedPublication.format,
      status: enrichedPublication.status,
      ideaId: enrichedPublication.ideaId ?? "none",
      note: enrichedPublication.note ?? "",
      url: enrichedPublication.url ?? "",
      hook: enrichedPublication.hook ?? "",
      caption: enrichedPublication.caption ?? "",
      postText: enrichedPublication.scriptMode === "post" ? enrichedPublication.caption ?? enrichedPublication.script ?? "" : "",
      cta: enrichedPublication.cta ?? "",
      script: enrichedPublication.script ?? "",
      storyboard: enrichedPublication.storyboard ?? "",
      scriptRows: enrichedPublication.scriptRows?.length
        ? enrichedPublication.scriptRows.map(row => createScriptRow(row))
        : rowsFromLegacyFields(enrichedPublication.script, enrichedPublication.storyboard, enrichedPublication.caption),
      scriptMode: enrichedPublication.scriptMode ?? inferScriptMode(enrichedPublication.format, enrichedPublication.storyboard, enrichedPublication.scriptRows),
      templateId: enrichedPublication.templateId ?? "none",
      checklist: (enrichedPublication.checklist ?? DEFAULT_PUBLICATION_CHECKLIST).map(item => ({ ...item })),
    });
  }, [enrichedPublication, mainPlatforms]);

  if (!publication || !enrichedPublication) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Публикация не найдена"
        description="Возможно, она была удалена или ссылка устарела."
        actionLabel="Вернуться в контент-план"
        onAction={() => setLocation("/content-plan")}
      />
    );
  }

  const currentPublication = enrichedPublication;
  const platform = state.platforms.find(item => item.id === form.platformId);
  const linkedIdea = state.ideas.find(item => item.id === form.ideaId);
  const template = state.templates.find(item => item.id === form.templateId);
  const overdue = isPublicationOverdue({ ...currentPublication, date: new Date(form.date).toISOString(), status: form.status });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  function updateScriptRow(id: string, key: "text" | "storyboard", value: string) {
    setForm(current => ({
      ...current,
      scriptRows: current.scriptRows.map(row => row.id === id ? { ...row, [key]: value } : row),
    }));
  }

  function addScriptRow() {
    setForm(current => ({ ...current, scriptRows: [...current.scriptRows, createScriptRow()] }));
  }

  function removeScriptRow(id: string) {
    setForm(current => ({
      ...current,
      scriptRows: current.scriptRows.length > 1
        ? current.scriptRows.filter(row => row.id !== id)
        : [createScriptRow()],
    }));
  }

  function setPostText(value: string) {
    setForm(current => ({
      ...current,
      postText: value,
      caption: value,
    }));
  }

  function setScriptMode(value: IdeaScriptMode) {
    setForm(current => ({
      ...current,
      scriptMode: value,
      scriptRows: current.scriptRows.length ? current.scriptRows : [createScriptRow()],
    }));
  }

  function savePublication() {
    if (!form.title.trim() || !form.platformId) return;
    const videoRows = form.scriptRows
      .map(row => ({
        ...row,
        text: row.text.trim(),
        storyboard: row.storyboard.trim(),
      }))
      .filter(row => row.text || row.storyboard);
    const normalizedRows = videoRows.length ? videoRows : [createScriptRow()];
    const videoScript = videoRows.map(row => row.text).filter(Boolean).join("\n\n");
    const storyboard = videoRows.map(row => row.storyboard).filter(Boolean).join("\n\n");
    const postText = form.postText.trim();

    const next: Publication = {
      ...currentPublication,
      title: form.title.trim(),
      date: new Date(form.date).toISOString(),
      platformId: form.platformId,
      format: form.format,
      status: form.status,
      ideaId: form.ideaId === "none" ? undefined : form.ideaId,
      note: form.note.trim() || undefined,
      url: form.url.trim() || undefined,
      hook: form.hook.trim() || undefined,
      caption: form.scriptMode === "post" ? postText || undefined : videoScript || undefined,
      cta: form.cta.trim() || undefined,
      script: form.scriptMode === "post" ? postText || undefined : videoScript || undefined,
      storyboard: storyboard || undefined,
      scriptRows: normalizedRows,
      scriptMode: form.scriptMode,
      templateId: form.templateId === "none" ? undefined : form.templateId,
      checklist: form.checklist,
    };

    updatePublication(next);
    toast({ title: "Публикация сохранена" });
  }

  function confirmDelete() {
    deletePublication(currentPublication.id);
    setDeleteOpen(false);
    setLocation("/content-plan");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={form.title || currentPublication.title}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/content-plan">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Link>
            </Button>
            <Button onClick={savePublication}>
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Публикация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Название</Label>
                <Input value={form.title} onChange={event => set("title", event.target.value)} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Дата</Label>
                  <Input type="date" value={form.date} onChange={event => set("date", event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Статус</Label>
                  <Select value={form.status} onValueChange={value => set("status", value as PublicationStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PUBLICATION_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Формат</Label>
                  <Select value={form.format} onValueChange={value => set("format", value as ContentFormat)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTENT_FORMATS.map(format => (
                        <SelectItem key={format} value={format}>{format}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Платформа</Label>
                  <Select value={form.platformId} onValueChange={value => set("platformId", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {mainPlatforms.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {state.ideas.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Связанная идея</Label>
                    <Select value={form.ideaId} onValueChange={value => set("ideaId", value)}>
                      <SelectTrigger><SelectValue placeholder="Не выбрана" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не выбрана</SelectItem>
                        {state.ideas.map(idea => (
                          <SelectItem key={idea.id} value={idea.id}>{idea.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Ссылка на публикацию</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={form.url}
                    placeholder="https://..."
                    onChange={event => set("url", event.target.value)}
                  />
                  {form.url.trim() && (
                    <Button type="button" variant="outline" size="icon" asChild>
                      <a href={form.url.trim()} target="_blank" rel="noreferrer" aria-label="Открыть публикацию">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    Сценарий / пост
                  </CardTitle>
                </div>
                <div className="grid grid-cols-2 rounded-2xl border border-border/80 bg-background/80 p-1">
                  {(["post", "video"] as IdeaScriptMode[]).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setScriptMode(mode)}
                      className={cn(
                        "min-h-10 rounded-xl px-4 text-sm font-semibold transition-all",
                        form.scriptMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {mode === "post" ? "Пост" : "Видео"}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.scriptMode === "post" ? (
                <div className="space-y-2">
                  <div className="flex items-end justify-between gap-3">
                    <Label>Текст поста</Label>
                    <span className="text-xs text-muted-foreground">{form.postText.trim().length} символов</span>
                  </div>
                  <Textarea
                    value={form.postText}
                    rows={14}
                    placeholder="Напишите пост целиком: заход, основная мысль, примеры и финальный призыв."
                    className="min-h-80 resize-y border-border/80 bg-background/70 text-base leading-7"
                    onChange={event => setPostText(event.target.value)}
                  />
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/80">
                  <div className="flex flex-col gap-3 border-b border-border/80 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Покадровый сценарий</p>
                    </div>
                  </div>
                  <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem] border-b border-border/80 bg-muted/20 text-sm font-semibold text-muted-foreground md:grid">
                    <div className="px-4 py-3">Текст</div>
                    <div className="border-l border-border/80 px-4 py-3">Раскадровка</div>
                    <div className="border-l border-border/80" />
                  </div>
                  <div className="divide-y divide-border/80">
                    {form.scriptRows.map((row, index) => (
                      <div key={row.id} className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem] md:gap-0 md:p-0">
                        <div className="space-y-1.5 md:p-3">
                          <Label className="md:hidden">Текст {index + 1}</Label>
                          <Textarea
                            value={row.text}
                            rows={5}
                            placeholder="Что говорим в этой части..."
                            className="min-h-32 resize-y border-border/80 bg-background/70"
                            onChange={event => updateScriptRow(row.id, "text", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5 md:border-l md:border-border/80 md:p-3">
                          <Label className="md:hidden">Раскадровка {index + 1}</Label>
                          <Textarea
                            value={row.storyboard}
                            rows={5}
                            placeholder="Что показываем: кадр, экран, жест, b-roll..."
                            className="min-h-32 resize-y border-border/80 bg-background/70"
                            onChange={event => updateScriptRow(row.id, "storyboard", event.target.value)}
                          />
                        </div>
                        <div className="flex items-center justify-end md:border-l md:border-border/80 md:p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() => removeScriptRow(row.id)}
                            aria-label={`Удалить строку ${index + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border/80 bg-muted/20 p-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 w-full rounded-xl gap-2"
                      onClick={addScriptRow}
                    >
                      <Plus className="h-4 w-4" />
                      Добавить строку
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Заметка</Label>
                <Textarea
                  value={form.note}
                  rows={3}
                  placeholder="Внутренние пометки: что снять, подготовить или проверить перед публикацией"
                  onChange={event => set("note", event.target.value)}
                />
              </div>

            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" onClick={savePublication}>
                <Save className="mr-2 h-4 w-4" />
                Сохранить изменения
              </Button>
              <Button variant="destructive" className="w-full justify-start" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить публикацию
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Сводка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-1.5">
                <span className={cn(
                  "inline-flex min-h-8 items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                  PUBLICATION_STATUS_COLORS[form.status],
                )}>
                  {STATUS_LABELS[form.status]}
                </span>
                <Badge variant="outline">{form.format}</Badge>
                {platform && (
                  <Badge variant="secondary" className="gap-1.5">
                    <PlatformAvatar platform={platform} size="xs" />
                    {platform.name}
                  </Badge>
                )}
                <Badge variant="outline">{form.scriptMode === "post" ? "Пост" : "Видео"}</Badge>
                {overdue && <Badge variant="destructive">Просрочено</Badge>}
              </div>
              <p className="text-muted-foreground">
                Дата: {new Date(form.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              {template && (
                <p className="text-muted-foreground">Шаблон: {template.name}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Подготовка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.templates.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      form.templateId !== "none" ? "bg-primary" : "bg-muted-foreground/35",
                    )} />
                    <Label>Шаблон</Label>
                  </div>
                  <Select value={form.templateId} onValueChange={value => set("templateId", value)}>
                    <SelectTrigger><SelectValue placeholder="Без шаблона" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Без шаблона</SelectItem>
                      {state.templates.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    form.hook.trim() ? "bg-primary" : "bg-muted-foreground/35",
                  )} />
                  <Label>Хук</Label>
                </div>
                <Input
                  value={form.hook}
                  placeholder="Первая фраза"
                  onChange={event => set("hook", event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    form.cta.trim() ? "bg-primary" : "bg-muted-foreground/35",
                  )} />
                  <Label>CTA</Label>
                </div>
                <Input
                  value={form.cta}
                  placeholder="Что сделать дальше"
                  onChange={event => set("cta", event.target.value)}
                />
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between gap-3">
                  <span>Текст</span>
                  <span className={form.scriptRows.some(row => row.text.trim()) || form.postText.trim() ? "text-primary" : ""}>
                    {form.scriptRows.some(row => row.text.trim()) || form.postText.trim() ? "готов" : "пусто"}
                  </span>
                </div>
                {form.scriptMode === "video" && (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span>Раскадровка</span>
                    <span className={form.scriptRows.some(row => row.storyboard.trim()) ? "text-primary" : ""}>
                      {form.scriptRows.some(row => row.storyboard.trim()) ? "готова" : "пусто"}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {linkedIdea && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Исходная идея</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
                  <p className="text-sm font-semibold">{linkedIdea.title}</p>
                  {linkedIdea.description && (
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{linkedIdea.description}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                  <Link href={`/ideas/${linkedIdea.id}`}>
                    <Lightbulb className="h-4 w-4" />
                    Открыть идею
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить публикацию?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
