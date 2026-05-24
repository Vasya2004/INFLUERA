import { useEffect, useState } from "react";
import type { ContentFormat, Idea, Platform, Publication, PublicationStatus, Template } from "@/lib/types";
import {
  CONTENT_FORMATS,
  DEFAULT_PUBLICATION_CHECKLIST,
  PUBLICATION_STATUSES,
  STATUS_LABELS,
} from "@/lib/content-plan-utils";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PublicationFormDialogProps = {
  open: boolean;
  onClose: () => void;
  pub?: Publication;
  initialDate?: string;
  platforms: Platform[];
  ideas: Idea[];
  templates: Template[];
};

export function PublicationFormDialog({
  open,
  onClose,
  pub,
  initialDate,
  platforms,
  ideas,
  templates,
}: PublicationFormDialogProps) {
  const { addPublication, updatePublication } = useStore();
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    platformId: platforms[0]?.id ?? "",
    format: "пост" as ContentFormat,
    status: "запланировано" as PublicationStatus,
    ideaId: "none",
    note: "",
    url: "",
    hook: "",
    caption: "",
    cta: "",
    templateId: "none",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      title: pub?.title ?? "",
      date: pub?.date
        ? pub.date.slice(0, 10)
        : initialDate ?? new Date().toISOString().slice(0, 10),
      platformId: pub?.platformId ?? platforms[0]?.id ?? "",
      format: (pub?.format ?? "пост") as ContentFormat,
      status: (pub?.status ?? "запланировано") as PublicationStatus,
      ideaId: pub?.ideaId ?? "none",
      note: pub?.note ?? "",
      url: pub?.url ?? "",
      hook: pub?.hook ?? "",
      caption: pub?.caption ?? "",
      cta: pub?.cta ?? "",
      templateId: pub?.templateId ?? "none",
    });
  }, [open, pub, initialDate, platforms]);

  const set = (key: string, value: string) => setForm(current => ({ ...current, [key]: value }));

  function handleSubmit() {
    if (!form.title || !form.platformId) return;

    const data = {
      title: form.title,
      date: new Date(form.date).toISOString(),
      platformId: form.platformId,
      format: form.format,
      status: form.status,
      ideaId: form.ideaId === "none" ? undefined : form.ideaId,
      note: form.note || undefined,
      url: form.url || undefined,
      hook: form.hook || undefined,
      caption: form.caption || undefined,
      cta: form.cta || undefined,
      templateId: form.templateId === "none" ? undefined : form.templateId,
      checklist: pub?.checklist ?? DEFAULT_PUBLICATION_CHECKLIST.map(item => ({ ...item })),
    };

    if (pub) updatePublication({ ...pub, ...data });
    else addPublication(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pub ? "Редактировать публикацию" : "Запланировать публикацию"}</DialogTitle>
          <DialogDescription className="sr-only">
            Настройте дату, платформу, формат, статус и материалы публикации.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Название</Label>
            <Input placeholder="UX-законы которые нужно знать" value={form.title} onChange={e => set("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Дата</Label>
              <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Платформа</Label>
              <Select value={form.platformId} onValueChange={value => set("platformId", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map(platform => (
                    <SelectItem key={platform.id} value={platform.id}>{platform.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Формат</Label>
              <Select value={form.format} onValueChange={value => set("format", value)}>
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
              <Select value={form.status} onValueChange={value => set("status", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PUBLICATION_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {ideas.length > 0 && (
            <div className="space-y-1.5">
              <Label>Связанная идея</Label>
              <Select value={form.ideaId} onValueChange={value => set("ideaId", value)}>
                <SelectTrigger><SelectValue placeholder="Не выбрана" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не выбрана</SelectItem>
                  {ideas.map(idea => (
                    <SelectItem key={idea.id} value={idea.id}>{idea.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <Label>Шаблон</Label>
              <Select value={form.templateId} onValueChange={value => set("templateId", value)}>
                <SelectTrigger><SelectValue placeholder="Без шаблона" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без шаблона</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Хук</Label>
            <Input placeholder="Первая строка, которая цепляет" value={form.hook} onChange={e => set("hook", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Текст / подпись</Label>
            <Textarea rows={3} placeholder="Основной текст публикации" value={form.caption} onChange={e => set("caption", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>CTA</Label>
            <Input placeholder="Подпишись / перейди по ссылке" value={form.cta} onChange={e => set("cta", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Заметка</Label>
            <Textarea placeholder="Внутренние пометки для себя" rows={2} value={form.note} onChange={e => set("note", e.target.value)} />
          </div>
          {(form.status === "опубликовано" || form.url) && (
            <div className="space-y-1.5">
              <Label>Ссылка на публикацию</Label>
              <Input placeholder="https://..." value={form.url} onChange={e => set("url", e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit}>{pub ? "Сохранить" : "Запланировать"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
