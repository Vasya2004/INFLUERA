import type { Idea, Platform, Publication, PublicationStatus } from "@/lib/types";
import {
  PUBLICATION_STATUSES,
  PUBLICATION_STATUS_COLORS,
  STATUS_LABELS,
  ensurePublicationChecklist,
  getAdjacentPublicationStatus,
  isPublicationOverdue,
  publicationProgress,
} from "@/lib/content-plan-utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type PublicationDetailSheetProps = {
  publication?: Publication;
  platforms: Platform[];
  ideas: Idea[];
  onClose: () => void;
  onEdit: (publication: Publication) => void;
};

function toDateInputValue(date: string) {
  return date.slice(0, 10);
}

function moveIsoDate(date: string, dayDelta: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + dayDelta);
  return next.toISOString();
}

export function PublicationDetailSheet({
  publication,
  platforms,
  ideas,
  onClose,
  onEdit,
}: PublicationDetailSheetProps) {
  const { updatePublication } = useStore();
  if (!publication) return null;

  const enriched = ensurePublicationChecklist(publication);
  const platform = platforms.find(item => item.id === enriched.platformId);
  const linkedIdea = ideas.find(item => item.id === enriched.ideaId);
  const progress = publicationProgress(enriched);
  const overdue = isPublicationOverdue(enriched);

  function patchPublication(patch: Partial<Publication>) {
    updatePublication({ ...enriched, ...patch });
  }

  function setStatus(status: PublicationStatus) {
    patchPublication({ status });
  }

  function setDate(date: string) {
    if (!date) return;
    patchPublication({ date: new Date(date).toISOString() });
  }

  function moveDate(dayDelta: number) {
    patchPublication({ date: moveIsoDate(enriched.date, dayDelta) });
  }

  function toggleChecklistItem(itemId: string, checked: boolean) {
    const checklist = (enriched.checklist ?? []).map(item =>
      item.id === itemId ? { ...item, done: checked } : item,
    );
    patchPublication({ checklist });
  }

  const prevStatus = getAdjacentPublicationStatus(enriched.status, "prev");
  const nextStatus = getAdjacentPublicationStatus(enriched.status, "next");

  return (
    <Sheet open={!!publication} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="pr-8">{enriched.title}</SheetTitle>
          <SheetDescription>
            {new Date(enriched.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            {overdue && <span className="ml-2 text-destructive">· просрочено</span>}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "inline-flex min-h-8 items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
              PUBLICATION_STATUS_COLORS[enriched.status],
            )}>
              {STATUS_LABELS[enriched.status]}
            </span>
            {platform && <Badge variant="secondary">{platform.name}</Badge>}
            <Badge variant="outline">{enriched.format}</Badge>
            <Badge variant="outline">{progress}% готово</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {PUBLICATION_STATUSES.map(status => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={enriched.status === status ? "default" : "outline"}
                className="min-h-9 rounded-xl px-3 text-xs"
                onClick={() => setStatus(status)}
              >
                {STATUS_LABELS[status]}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {prevStatus && (
              <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setStatus(prevStatus)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                {STATUS_LABELS[prevStatus]}
              </Button>
            )}
            {nextStatus && (
              <Button type="button" variant="outline" size="sm" className="ml-auto rounded-xl" onClick={() => setStatus(nextStatus)}>
                {STATUS_LABELS[nextStatus]}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sheet-publication-date" className="text-xs text-muted-foreground">Дата публикации</Label>
              <Input
                id="sheet-publication-date"
                type="date"
                value={toDateInputValue(enriched.date)}
                onChange={event => setDate(event.target.value)}
                className="h-10 rounded-xl bg-background"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => moveDate(-1)}>-1 день</Button>
              <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => moveDate(1)}>+1 день</Button>
              <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => moveDate(7)}>+7 дней</Button>
            </div>
          </div>

          {(enriched.hook || enriched.caption || enriched.cta) && (
            <div className="space-y-2 rounded-xl border border-border p-3">
              {enriched.hook && (
                <div>
                  <p className="text-xs text-muted-foreground">Хук</p>
                  <p className="mt-1 text-sm">{enriched.hook}</p>
                </div>
              )}
              {enriched.caption && (
                <div>
                  <p className="text-xs text-muted-foreground">Текст</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{enriched.caption}</p>
                </div>
              )}
              {enriched.cta && (
                <div>
                  <p className="text-xs text-muted-foreground">CTA</p>
                  <p className="mt-1 text-sm">{enriched.cta}</p>
                </div>
              )}
            </div>
          )}

          {linkedIdea && (
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Исходная идея</p>
              <p className="mt-1 text-sm font-medium">{linkedIdea.title}</p>
              {linkedIdea.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{linkedIdea.description}</p>
              )}
              <Link href="/ideas">
                <Button type="button" variant="outline" size="sm" className="mt-2 h-8 rounded-xl text-xs">
                  <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
                  Открыть в идеях
                </Button>
              </Link>
            </div>
          )}

          {enriched.note && (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Заметка</p>
              <p className="mt-1 text-sm">{enriched.note}</p>
            </div>
          )}

          <div className="rounded-xl border border-border p-3">
            <p className="mb-3 text-sm font-medium">Чеклист подготовки</p>
            <div className="space-y-2">
              {(enriched.checklist ?? []).map(item => (
                <label key={item.id} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={value => toggleChecklistItem(item.id, value === true)}
                  />
                  <span className={cn(item.done && "text-muted-foreground line-through")}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {enriched.url && (
            <a href={enriched.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <ExternalLink className="h-4 w-4" />
              Открыть публикацию
            </a>
          )}
        </div>

        <SheetFooter className="mt-6 gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onEdit(enriched)}>Редактировать</Button>
          <Button onClick={onClose}>Готово</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
