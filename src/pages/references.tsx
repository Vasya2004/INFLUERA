import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CreatorReference, CreatorReferenceType } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/app/page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

const REFERENCE_TYPES: CreatorReferenceType[] = ["блогер", "эксперт", "бренд"];
const REFERENCE_PLATFORMS = ["Instagram", "Telegram", "YouTube", "TikTok", "VK", "X", "Сайт", "Подкаст", "Другое"];

const TYPE_STYLES: Record<CreatorReferenceType, string> = {
  блогер: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  эксперт: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  бренд: "border-violet-400/30 bg-violet-500/10 text-violet-200",
};

function parseTagsInput(value: string) {
  return value
    .split(",")
    .map(tag => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
}

function formatTagsInput(tags?: string[]) {
  return (tags ?? []).map(tag => `#${tag.replace(/^#/, "")}`).join(", ");
}

function getReferenceForm(reference?: CreatorReference) {
  return {
    name: reference?.name ?? "",
    handle: reference?.handle ?? "",
    platform: reference?.platform ?? "Instagram",
    url: reference?.url ?? "",
    type: reference?.type && REFERENCE_TYPES.includes(reference.type) ? reference.type : "блогер",
    niche: reference?.niche ?? "",
    contentFocus: reference?.contentFocus ?? "",
    tags: formatTagsInput(reference?.tags),
    favorite: Boolean(reference?.favorite),
  };
}

function ReferenceDialog({
  open,
  onClose,
  reference,
}: {
  open: boolean;
  onClose: () => void;
  reference?: CreatorReference;
}) {
  const { addReference, updateReference } = useStore();
  const [form, setForm] = useState(() => getReferenceForm(reference));

  useEffect(() => {
    if (open) setForm(getReferenceForm(reference));
  }, [open, reference]);

  const set = (key: string, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));

  function handleSubmit() {
    const name = form.name.trim();
    if (!name) return;

    const data = {
      name,
      handle: form.handle.trim(),
      platform: form.platform,
      url: form.url.trim(),
      type: form.type as CreatorReferenceType,
      niche: form.niche.trim(),
      contentFocus: form.contentFocus.trim(),
      whyRelevant: reference?.whyRelevant ?? "",
      notes: reference?.notes ?? "",
      tags: parseTagsInput(form.tags),
      rating: reference?.rating ?? 3,
      favorite: form.favorite,
    };

    if (reference) updateReference({ ...reference, ...data });
    else addReference(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{reference ? "Редактировать референс" : "Добавить референс"}</DialogTitle>
          <DialogDescription className="sr-only">
            Сохраните блогера, эксперта или бренд, на который хотите ориентироваться.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Имя / название</Label>
              <Input value={form.name} onChange={event => set("name", event.target.value)} placeholder="Например, автор или бренд" />
            </div>
            <div className="space-y-1.5">
              <Label>Ник</Label>
              <Input value={form.handle} onChange={event => set("handle", event.target.value)} placeholder="@username" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Тип</Label>
              <Select value={form.type} onValueChange={value => set("type", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFERENCE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Площадка</Label>
              <Select value={form.platform} onValueChange={value => set("platform", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFERENCE_PLATFORMS.map(platform => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ссылка</Label>
            <Input value={form.url} onChange={event => set("url", event.target.value)} placeholder="https://..." />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Ниша</Label>
              <Input value={form.niche} onChange={event => set("niche", event.target.value)} placeholder="Дизайн, спорт, лайфстайл..." />
            </div>
            <div className="space-y-1.5">
              <Label>Хэштеги</Label>
              <Input value={form.tags} onChange={event => set("tags", event.target.value)} placeholder="#монтаж, #хуки, #визуал" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Что смотреть</Label>
            <Input
              value={form.contentFocus}
              onChange={event => set("contentFocus", event.target.value)}
              placeholder="Подача, монтаж, темы, рубрики, сторителлинг"
            />
          </div>

          <button
            type="button"
            onClick={() => set("favorite", !form.favorite)}
            className={cn(
              "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors",
              form.favorite
                ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <Star className={cn("h-4 w-4", form.favorite && "fill-current")} />
            {form.favorite ? "В избранном" : "Добавить в избранное"}
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit}>{reference ? "Сохранить" : "Добавить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function References({ embedded = false }: { embedded?: boolean }) {
  const { state, deleteReference } = useStore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReference, setEditReference] = useState<CreatorReference | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CreatorReferenceType | "all">("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  const references = state.references ?? [];
  const availablePlatforms = useMemo(() => {
    return Array.from(new Set(references.map(reference => reference.platform).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ru"));
  }, [references]);

  const filteredReferences = useMemo(() => {
    const query = search.trim().toLowerCase();
    return references
      .filter(reference => {
        if (typeFilter !== "all" && reference.type !== typeFilter) return false;
        if (platformFilter !== "all" && reference.platform !== platformFilter) return false;
        if (favoriteOnly && !reference.favorite) return false;
        if (!query) return true;

        return [
          reference.name,
          reference.handle,
          reference.platform,
          reference.niche,
          reference.contentFocus,
          ...(reference.tags ?? []),
        ].join(" ").toLowerCase().includes(query);
      })
      .sort((a, b) => {
        if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [references, search, typeFilter, platformFilter, favoriteOnly]);

  function openAdd() {
    setEditReference(undefined);
    setDialogOpen(true);
  }

  function openEdit(reference: CreatorReference) {
    setEditReference(reference);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditReference(undefined);
  }

  async function copyUrl(reference: CreatorReference) {
    if (!reference.url) return;
    try {
      await navigator.clipboard.writeText(reference.url);
      toast({ title: "Ссылка скопирована" });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  }

  return (
    <div className={cn("space-y-5", !embedded && "space-y-8")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Референсы</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Блогеры, эксперты и бренды, на которые можно ориентироваться.
          </p>
        </div>
        <Button onClick={openAdd} data-testid="button-add-reference">
          <Plus className="mr-2 h-4 w-4" />Добавить референс
        </Button>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/70 p-3">
        <div className="grid gap-2 lg:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Поиск" value={search} onChange={event => setSearch(event.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={value => setTypeFilter(value as CreatorReferenceType | "all")}>
            <SelectTrigger><SelectValue placeholder="Все типы" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {REFERENCE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger><SelectValue placeholder="Все площадки" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все площадки</SelectItem>
              {availablePlatforms.map(platform => <SelectItem key={platform} value={platform}>{platform}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={favoriteOnly ? "default" : "outline"}
            className="gap-2"
            onClick={() => setFavoriteOnly(value => !value)}
          >
            <Star className={cn("h-4 w-4", favoriteOnly && "fill-current")} />
            Избранные
          </Button>
        </div>
      </div>

      {filteredReferences.length === 0 ? (
        <EmptyState
          icon={Users}
          title={references.length === 0 ? "Пока нет референсов" : "Ничего не найдено"}
          description={
            references.length === 0
              ? "Добавьте авторов, блогеров или бренды, чтобы держать под рукой ориентиры для контента."
              : "Попробуйте изменить поиск или фильтры."
          }
          actionLabel={references.length === 0 ? "Добавить референс" : undefined}
          onAction={references.length === 0 ? openAdd : undefined}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredReferences.map((reference, index) => (
              <motion.div
                key={reference.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="h-full border-border/80">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                          <UserRound className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="truncate text-base">{reference.name}</CardTitle>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {reference.handle && <span>{reference.handle}</span>}
                            {reference.platform && <span>{reference.platform}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {reference.favorite && <Star className="h-4 w-4 fill-amber-300 text-amber-300" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className={cn("capitalize", TYPE_STYLES[reference.type])}>
                        {reference.type}
                      </Badge>
                      {reference.niche && <Badge variant="secondary">{reference.niche}</Badge>}
                      {(reference.tags ?? []).slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-muted-foreground">#{tag.replace(/^#/, "")}</Badge>
                      ))}
                    </div>

                    {reference.contentFocus && (
                      <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-3">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Смотреть: </span>
                          {reference.contentFocus}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {reference.url && (
                        <Button asChild variant="outline" size="sm" className="gap-2">
                          <a href={reference.url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />Открыть
                          </a>
                        </Button>
                      )}
                      {reference.url && (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => copyUrl(reference)}>
                          <Copy className="h-4 w-4" />Ссылка
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(reference)}>
                        <Pencil className="h-4 w-4" />Изменить
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={() => setDeleteId(reference.id)}>
                        <Trash2 className="h-4 w-4" />Удалить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      <ReferenceDialog open={dialogOpen} onClose={closeDialog} reference={editReference} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить референс?</AlertDialogTitle>
            <AlertDialogDescription>
              Запись будет удалена из базы ориентиров. Это не затронет платформы, идеи и публикации.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteReference(deleteId!); setDeleteId(null); }}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ReferencesPage() {
  return <References />;
}
