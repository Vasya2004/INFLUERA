import { useEffect, useMemo, useState } from "react";
import type { ContentFormat, Idea, Platform, PublicationStatus } from "@/lib/types";
import { CONTENT_FORMATS, DEFAULT_PUBLICATION_CHECKLIST, PUBLICATION_STATUSES, STATUS_LABELS } from "@/lib/content-plan-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PlatformAvatar } from "@/components/app/platform-avatar";

type PlanFromIdeaDialogProps = {
  open: boolean;
  idea?: Idea;
  platforms: Platform[];
  onClose: () => void;
  onConfirm: (payload: {
    title: string;
    date: string;
    platformId: string;
    format: ContentFormat;
    status: PublicationStatus;
    note?: string;
  }) => void;
};

export function PlanFromIdeaDialog({ open, idea, platforms, onClose, onConfirm }: PlanFromIdeaDialogProps) {
  const mainPlatforms = useMemo(
    () => platforms.filter(platform => platform.role === "основная площадка"),
    [platforms],
  );
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    platformId: mainPlatforms[0]?.id ?? "",
    format: "пост" as ContentFormat,
    status: "запланировано" as PublicationStatus,
  });

  useEffect(() => {
    if (!open || !idea) return;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);
    defaultDate.setHours(12, 0, 0, 0);
    setForm({
      title: idea.title,
      date: defaultDate.toISOString().slice(0, 10),
      platformId: idea.platformId && mainPlatforms.some(platform => platform.id === idea.platformId)
        ? idea.platformId
        : mainPlatforms[0]?.id ?? "",
      format: idea.format,
      status: "запланировано",
    });
  }, [open, idea, mainPlatforms]);

  if (!idea) return null;

  function handleConfirm() {
    if (!form.title || !form.platformId) return;
    onConfirm({
      title: form.title,
      date: new Date(form.date).toISOString(),
      platformId: form.platformId,
      format: form.format,
      status: form.status,
      note: idea?.description || undefined,
    });
    onClose();
  }

  const platform = mainPlatforms.find(item => item.id === form.platformId);

  return (
    <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>В контент-план</DialogTitle>
          <DialogDescription>
            Проверьте дату и платформу перед созданием публикации из идеи.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-border bg-muted/25 p-3">
            <p className="text-xs text-muted-foreground">Превью</p>
            <p className="mt-1 text-sm font-semibold">{form.title}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {platform && (
                <Badge variant="secondary" className="gap-1.5">
                  <PlatformAvatar platform={platform} size="xs" />
                  {platform.name}
                </Badge>
              )}
              <Badge variant="outline">{form.format}</Badge>
              <Badge variant="outline">{STATUS_LABELS[form.status]}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Чеклист: {DEFAULT_PUBLICATION_CHECKLIST.length} пунктов подготовки
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Название публикации</Label>
            <Input value={form.title} onChange={e => setForm(current => ({ ...current, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Дата</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(current => ({ ...current, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Платформа</Label>
              <Select value={form.platformId} onValueChange={value => setForm(current => ({ ...current, platformId: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mainPlatforms.map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Формат</Label>
              <Select value={form.format} onValueChange={value => setForm(current => ({ ...current, format: value as ContentFormat }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_FORMATS.map(format => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Статус</Label>
              <Select value={form.status} onValueChange={value => setForm(current => ({ ...current, status: value as PublicationStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PUBLICATION_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleConfirm}>Создать публикацию</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
