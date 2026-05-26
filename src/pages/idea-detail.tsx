import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import type { ContentFormat, IdeaScriptMode, IdeaScriptRow, IdeaStatus, Priority, PublicationStatus } from "@/lib/types";
import { useStore } from "@/lib/store";
import { CONTENT_FORMATS, DEFAULT_PUBLICATION_CHECKLIST, STATUS_LABELS } from "@/lib/content-plan-utils";
import { IDEA_STATUSES, IDEA_STATUS_LABELS, formatTagsInput, getPublicationsForIdea, parseTagsInput } from "@/lib/ideas-utils";
import { PlanFromIdeaDialog } from "@/components/content-plan/plan-from-idea-dialog";
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
import { Archive, ArrowLeft, CalendarPlus, ExternalLink, FileText, Lightbulb, Plus, Save, Trash2 } from "lucide-react";

const PRIORITIES: Priority[] = ["высокий", "средний", "низкий"];

function createScriptRow(row?: Partial<IdeaScriptRow>): IdeaScriptRow {
  return {
    id: row?.id ?? Math.random().toString(36).slice(2, 9),
    text: row?.text ?? "",
    storyboard: row?.storyboard ?? "",
  };
}

function rowsFromLegacyFields(script?: string, storyboard?: string): IdeaScriptRow[] {
  const scriptParts = (script ?? "").split(/\n{2,}/);
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

export default function IdeaDetail() {
  const [, params] = useRoute("/ideas/:id");
  const [, setLocation] = useLocation();
  const { state, updateIdea, deleteIdea, addPublication } = useStore();
  const { toast } = useToast();
  const idea = state.ideas.find(item => item.id === params?.id);
  const linkedPublications = useMemo(
    () => idea ? getPublicationsForIdea(state.publications, idea.id) : [],
    [idea, state.publications],
  );
  const [planOpen, setPlanOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sourceUrl: "",
    script: "",
    storyboard: "",
    scriptRows: [createScriptRow()],
    scriptMode: "post" as IdeaScriptMode,
    format: "пост" as ContentFormat,
    priority: "средний" as Priority,
    status: "новая" as IdeaStatus,
    platformId: "any",
    tags: "",
  });

  useEffect(() => {
    if (!idea) return;
    setForm({
      title: idea.title,
      description: idea.description,
      sourceUrl: idea.sourceUrl ?? "",
      script: idea.script ?? "",
      storyboard: idea.storyboard ?? "",
      scriptRows: idea.scriptRows?.length ? idea.scriptRows.map(row => createScriptRow(row)) : rowsFromLegacyFields(idea.script, idea.storyboard),
      scriptMode: idea.scriptMode ?? inferScriptMode(idea.format, idea.storyboard, idea.scriptRows),
      format: idea.format,
      priority: idea.priority,
      status: idea.status,
      platformId: idea.platformId ?? "any",
      tags: formatTagsInput(idea.tags),
    });
  }, [idea]);

  if (!idea) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="Идея не найдена"
        description="Возможно, она была удалена или ссылка устарела."
        actionLabel="Вернуться к идеям"
        onAction={() => setLocation("/ideas")}
      />
    );
  }

  const currentIdea = idea;
  const platform = state.platforms.find(item => item.id === form.platformId);
  const set = (key: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
  };
  const updateScriptRow = (id: string, key: "text" | "storyboard", value: string) => {
    setForm(current => ({
      ...current,
      scriptRows: current.scriptRows.map(row => row.id === id ? { ...row, [key]: value } : row),
    }));
  };
  const addScriptRow = () => {
    setForm(current => ({ ...current, scriptRows: [...current.scriptRows, createScriptRow()] }));
  };
  const setPostScript = (value: string) => {
    setForm(current => ({
      ...current,
      scriptRows: [{ ...(current.scriptRows[0] ?? createScriptRow()), text: value, storyboard: "" }],
    }));
  };
  const setScriptMode = (value: IdeaScriptMode) => {
    setForm(current => ({
      ...current,
      scriptMode: value,
      scriptRows: value === "post"
        ? [{ ...(current.scriptRows[0] ?? createScriptRow()), text: current.scriptRows.map(row => row.text).filter(Boolean).join("\n\n"), storyboard: "" }]
        : current.scriptRows.length ? current.scriptRows : [createScriptRow()],
    }));
  };
  const removeScriptRow = (id: string) => {
    setForm(current => ({
      ...current,
      scriptRows: current.scriptRows.length > 1
        ? current.scriptRows.filter(row => row.id !== id)
        : [createScriptRow()],
    }));
  };

  function saveIdea() {
    if (!form.title.trim()) return;
    const scriptRows = form.scriptRows
      .map(row => ({
        ...row,
        text: row.text.trim(),
        storyboard: form.scriptMode === "post" ? "" : row.storyboard.trim(),
      }))
      .filter(row => row.text || row.storyboard);
    const normalizedRows = scriptRows.length ? scriptRows : [createScriptRow()];
    updateIdea({
      ...currentIdea,
      title: form.title.trim(),
      description: form.description.trim(),
      sourceUrl: form.sourceUrl.trim() || undefined,
      script: scriptRows.map(row => row.text).filter(Boolean).join("\n\n") || undefined,
      storyboard: form.scriptMode === "post" ? undefined : scriptRows.map(row => row.storyboard).filter(Boolean).join("\n\n") || undefined,
      scriptRows: normalizedRows,
      scriptMode: form.scriptMode,
      format: form.format,
      priority: form.priority,
      status: form.status,
      platformId: form.platformId === "any" ? undefined : form.platformId,
      tags: parseTagsInput(form.tags),
    });
    toast({ title: "Идея сохранена" });
  }

  function openPlanDialog() {
    if (!state.platforms.length) {
      toast({
        title: "Добавьте платформу",
        description: "Чтобы перенести идею в контент-план, нужна хотя бы одна платформа.",
        variant: "destructive",
      });
      return;
    }
    setPlanOpen(true);
  }

  function confirmPlanIdea(payload: {
    title: string;
    date: string;
    platformId: string;
    format: ContentFormat;
    status: PublicationStatus;
    note?: string;
  }) {
    addPublication({
      ...payload,
      ideaId: currentIdea.id,
      checklist: DEFAULT_PUBLICATION_CHECKLIST.map(item => ({ ...item })),
    });
    if (currentIdea.status !== "архив") {
      updateIdea({ ...currentIdea, status: "превращена в публикацию" });
      setForm(current => ({ ...current, status: "превращена в публикацию" }));
    }
    toast({
      title: "Публикация создана",
      description: `Идея ушла из активного списка и теперь находится в разделе «В плане».`,
    });
  }

  function archiveIdea() {
    updateIdea({ ...currentIdea, status: "архив" });
    toast({
      title: "Идея отправлена в архив",
      description: "Она больше не будет показываться среди активных идей.",
    });
    setLocation("/ideas");
  }

  function confirmDelete() {
    deleteIdea(currentIdea.id);
    setDeleteOpen(false);
    setLocation("/ideas");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={currentIdea.title}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/ideas">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Link>
            </Button>
            <Button onClick={saveIdea}>
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
              <CardTitle className="text-lg">Идея</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Название</Label>
                <Input value={form.title} onChange={event => set("title", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Описание</Label>
                <Textarea
                  value={form.description}
                  rows={4}
                  placeholder="Коротко: для кого идея, какой инсайт и что должен сделать зритель."
                  onChange={event => set("description", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Теги</Label>
                <Input value={form.tags} placeholder="ux, telegram, запуск" onChange={event => set("tags", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ссылка</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={form.sourceUrl}
                    placeholder="https://..."
                    onChange={event => set("sourceUrl", event.target.value)}
                  />
                  {form.sourceUrl.trim() && (
                    <Button type="button" variant="outline" size="icon" asChild>
                      <a href={form.sourceUrl.trim()} target="_blank" rel="noreferrer" aria-label="Открыть ссылку">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Статус</Label>
                  <Select value={form.status} onValueChange={value => set("status", value as IdeaStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IDEA_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{IDEA_STATUS_LABELS[status]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Приоритет</Label>
                  <Select value={form.priority} onValueChange={value => set("priority", value as Priority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(priority => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Формат</Label>
                  <Select value={form.format} onValueChange={value => set("format", value as ContentFormat)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTENT_FORMATS.map(format => <SelectItem key={format} value={format}>{format}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Платформа</Label>
                  <Select value={form.platformId} onValueChange={value => set("platformId", value)}>
                    <SelectTrigger><SelectValue placeholder="Любая" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Любая</SelectItem>
                      {state.platforms.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Сценарий / пост
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="grid grid-cols-2 rounded-xl border border-border/80 bg-background/80 p-1">
                    {(["post", "video"] as IdeaScriptMode[]).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setScriptMode(mode)}
                        className={cn(
                          "min-h-9 rounded-lg px-3 text-xs font-semibold transition-all",
                          form.scriptMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {mode === "post" ? "Пост" : "Видео"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.scriptMode === "post" ? (
                <div className="space-y-1.5">
                  <Label>Текст поста</Label>
                  <Textarea
                    value={form.scriptRows[0]?.text ?? ""}
                    rows={10}
                    placeholder="Напишите текст поста..."
                    className="min-h-64 resize-y border-border/80 bg-background/70"
                    onChange={event => setPostScript(event.target.value)}
                  />
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/80">
                  <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3rem] border-b border-border/80 bg-muted/35 text-sm font-semibold text-muted-foreground md:grid">
                    <div className="px-4 py-3">Текст</div>
                    <div className="border-l border-border/80 px-4 py-3">Раскадровка</div>
                    <div className="border-l border-border/80 px-3 py-3" />
                  </div>
                  <div className="divide-y divide-border/80">
                    {form.scriptRows.map((row, index) => (
                      <div key={row.id} className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3rem] md:gap-0 md:p-0">
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
                            placeholder="Что показываем во время этого текста..."
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
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" onClick={openPlanDialog}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Добавить в контент-план
              </Button>
              {currentIdea.status !== "архив" && (
                <Button variant="outline" className="w-full justify-start" onClick={archiveIdea}>
                  <Archive className="mr-2 h-4 w-4" />
                  Завершить и скрыть
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start" onClick={saveIdea}>
                <Save className="mr-2 h-4 w-4" />
                Сохранить изменения
              </Button>
              <Button variant="destructive" className="w-full justify-start" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить идею
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Сводка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-1.5">
                <Badge>{IDEA_STATUS_LABELS[form.status]}</Badge>
                <Badge variant="outline">{form.priority}</Badge>
                <Badge variant="outline">{form.format}</Badge>
                {platform && <Badge variant="secondary">{platform.name}</Badge>}
              </div>
              <p className="text-muted-foreground">
                Создана {new Date(currentIdea.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              {form.sourceUrl.trim() && (
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                  <a href={form.sourceUrl.trim()} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Открыть ссылку
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Публикации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {linkedPublications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Эта идея пока не добавлена в контент-план.</p>
              ) : linkedPublications.map(publication => {
                const publicationPlatform = state.platforms.find(item => item.id === publication.platformId);
                return (
                  <Link
                    key={publication.id}
                    href={`/content-plan/${publication.id}`}
                    className="block rounded-xl border border-border/80 bg-muted/20 p-3 transition-colors hover:border-primary/40"
                  >
                    <p className="text-sm font-semibold">{publication.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{STATUS_LABELS[publication.status]}</Badge>
                      {publicationPlatform && <Badge variant="outline">{publicationPlatform.name}</Badge>}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(publication.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </aside>
      </div>

      <PlanFromIdeaDialog
        open={planOpen}
        idea={{ ...currentIdea, ...form, platformId: form.platformId === "any" ? undefined : form.platformId, tags: parseTagsInput(form.tags) }}
        platforms={state.platforms}
        onClose={() => setPlanOpen(false)}
        onConfirm={confirmPlanIdea}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить идею?</AlertDialogTitle>
            <AlertDialogDescription>
              Идея будет удалена из базы. Связанные публикации в контент-плане останутся на месте.
            </AlertDialogDescription>
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
