import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Template, TemplateCategory, TemplateFile, ContentFormat } from "@/lib/types";
import { CONTENT_FORMATS } from "@/lib/content-plan-utils";
import { TEMPLATE_CATEGORIES, TEMPLATE_CATEGORY_COLORS } from "@/lib/template-utils";
import { formatBytes, validateFile } from "@/lib/file-validation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Copy, LayoutTemplate, Paperclip, Download, X, FileText, CalendarPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { EmptyState, PageHeader } from "@/components/app/page";
import { cn } from "@/lib/utils";

function genFileId() {
  return Math.random().toString(36).slice(2, 9);
}

function readFiles(files: FileList | File[]): Promise<TemplateFile[]> {
  return Promise.all(
    [...files].map(file => new Promise<TemplateFile>((resolve, reject) => {
      const validationError = validateFile(file, "template-files");
      if (validationError) {
        reject(new Error(`${file.name}: ${validationError}`));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: genFileId(),
        name: file.name,
        url: reader.result as string,
        mimeType: file.type,
        sizeBytes: file.size,
        bucket: "template-files",
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })),
  );
}

function TemplateFilesList({
  files,
  onRemove,
  compact,
}: {
  files: TemplateFile[];
  onRemove?: (id: string) => void;
  compact?: boolean;
}) {
  if (files.length === 0) return null;

  return (
    <ul className={cn("space-y-1.5", compact && "space-y-1")}>
      {files.map(file => (
        <li
          key={file.id}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-2 text-sm",
            compact && "px-2 py-1.5",
          )}
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-medium" title={file.name}>
            {file.name}
            {file.sizeBytes ? <span className="ml-1 font-normal text-muted-foreground">({formatBytes(file.sizeBytes)})</span> : null}
          </span>
          <a
            href={file.url ?? "#"}
            download={file.name}
            className={cn("shrink-0 text-primary hover:opacity-80", !file.url && "pointer-events-none opacity-40")}
            onClick={e => e.stopPropagation()}
          >
            <Download className="h-4 w-4" />
          </a>
          {onRemove && (
            <button
              type="button"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(file.id)}
              aria-label={`Удалить ${file.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function TemplateFileUpload({
  files,
  onChange,
  inputId,
}: {
  files: TemplateFile[];
  onChange: (files: TemplateFile[]) => void;
  inputId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files;
    if (!picked?.length) return;
    setLoading(true);
    setError("");
    try {
      const next = await readFiles(picked);
      onChange([...files, ...next]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось прикрепить файл");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>Файлы</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="h-3.5 w-3.5" />
          {loading ? "Загрузка…" : "Прикрепить"}
        </Button>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        className="sr-only"
        onChange={handlePick}
      />
      <TemplateFilesList
        files={files}
        onRemove={id => onChange(files.filter(f => f.id !== id))}
        compact
      />
      {files.length === 0 && (
        <p className="text-xs text-muted-foreground">PDF, TXT и изображения до 10 МБ.</p>
      )}
      {error && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
          <span>{error}</span>
          <button type="button" className="font-medium underline" onClick={() => inputRef.current?.click()}>
            Повторить
          </button>
        </div>
      )}
    </div>
  );
}

function AddTemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addTemplate } = useStore();
  const [form, setForm] = useState({
    name: "",
    category: "структура публикации" as TemplateCategory,
    description: "",
    usage: "",
    content: "",
    formats: [] as ContentFormat[],
    files: [] as TemplateFile[],
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function toggleFormat(f: ContentFormat) {
    setForm(prev => ({
      ...prev,
      formats: prev.formats.includes(f) ? prev.formats.filter(x => x !== f) : [...prev.formats, f],
    }));
  }

  function reset() {
    setForm({
      name: "",
      category: "структура публикации",
      description: "",
      usage: "",
      content: "",
      formats: [],
      files: [],
    });
  }

  function handleSubmit() {
    if (!form.name || !form.content) return;
    addTemplate({
      name: form.name,
      category: form.category,
      description: form.description,
      usage: form.usage,
      content: form.content,
      format: form.formats.length > 0 ? form.formats : ["пост"],
      files: form.files,
    });
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый материал</DialogTitle>
          <DialogDescription className="sr-only">
            Создайте материал с категорией, описанием, структурой, форматами и файлами.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Название</Label>
            <Input placeholder="Проблема → решение → вывод" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Категория</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Описание</Label>
            <Input placeholder="Краткое описание материала" value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Когда использовать</Label>
            <Input placeholder="Для ответов на вопросы аудитории..." value={form.usage} onChange={e => set("usage", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Структура / контент материала</Label>
            <Textarea placeholder="1. Шаг первый&#10;2. Шаг второй&#10;3. Вывод" rows={5} value={form.content} onChange={e => set("content", e.target.value)} />
          </div>
          <TemplateFileUpload
            inputId="template-add-files"
            files={form.files}
            onChange={files => setForm(f => ({ ...f, files }))}
          />
          <div className="space-y-2">
            <Label>Форматы</Label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_FORMATS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFormat(f)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${form.formats.includes(f) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary/50"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Отмена</Button>
          <Button onClick={handleSubmit}>Создать материал</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCardFiles({ template }: { template: Template }) {
  const { updateTemplate } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const files = template.files ?? [];

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files;
    if (!picked?.length) return;
    setLoading(true);
    setError("");
    try {
      const next = await readFiles(picked);
      updateTemplate({ ...template, files: [...files, ...next] });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось прикрепить файл");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  function removeFile(id: string) {
    updateTemplate({ ...template, files: files.filter(f => f.id !== id) });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Файлы</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip className="h-3 w-3" />
          {loading ? "…" : "Добавить"}
        </Button>
      </div>
      <input ref={inputRef} type="file" multiple className="sr-only" onChange={handlePick} />
      <TemplateFilesList files={files} onRemove={removeFile} compact />
      {error && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" className="font-medium underline" onClick={() => inputRef.current?.click()}>
            Повторить
          </button>
        </div>
      )}
    </div>
  );
}

export function Templates({ embedded = false }: { embedded?: boolean }) {
  const { state, deleteTemplate, addPublication } = useStore();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | "все">("все");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = activeCategory === "все"
    ? state.templates
    : state.templates.filter(t => t.category === activeCategory);

  const grouped = TEMPLATE_CATEGORIES.reduce<Record<TemplateCategory, Template[]>>((acc, cat) => {
    acc[cat] = filtered.filter(t => t.category === cat);
    return acc;
  }, {} as Record<TemplateCategory, Template[]>);

  function copyTemplate(t: Template) {
    navigator.clipboard.writeText(t.content).then(() => {
      toast({ title: "Скопировано", description: `«${t.name}» скопирован в буфер обмена` });
    });
  }

  function createPublicationFromTemplate(template: Template) {
    const platformId = state.platforms[0]?.id;
    if (!platformId) {
      toast({ title: "Добавьте платформу", description: "Чтобы создать публикацию из материала, нужна хотя бы одна платформа." });
      return;
    }

    addPublication({
      title: template.name,
      date: new Date().toISOString(),
      platformId,
      format: template.format[0] ?? "пост",
      status: "в работе",
      caption: template.content,
      templateId: template.id,
      checklist: [],
      files: (template.files ?? [])
        .filter(file => file.url?.startsWith("data:"))
        .map(file => ({
          ...file,
          id: genFileId(),
          bucket: "publication-files",
        })),
    });
    toast({ title: "Публикация создана", description: `Материал «${template.name}» добавлен в контент-план.` });
  }

  return (
    <div className={cn("space-y-8", embedded && "space-y-5")}>
      {!embedded && (
        <PageHeader
          title="Материалы"
          action={
            <Button onClick={() => setDialogOpen(true)} data-testid="button-add-template">
              <Plus className="mr-2 h-4 w-4" />Добавить материал
            </Button>
          }
        />
      )}
      {embedded && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Материалы</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Шаблоны, сценарии, хуки, структуры публикаций и прикреплённые файлы.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-add-template">
            <Plus className="mr-2 h-4 w-4" />Добавить материал
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["все", ...TEMPLATE_CATEGORIES] as (TemplateCategory | "все")[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
          >
            {cat === "все" ? "Все материалы" : cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="Нет материалов"
          description="Создайте первый материал для повторяемых сценариев, хуков или структур публикаций."
          actionLabel="Добавить материал"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          {TEMPLATE_CATEGORIES.map(cat => {
            const items = grouped[cat];
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-4">
                {activeCategory === "все" && (
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{cat}</h2>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07 }}
                      data-testid={`card-template-${template.id}`}
                    >
                      <Card className="h-full flex flex-col group hover:border-primary/40 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 space-y-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TEMPLATE_CATEGORY_COLORS[template.category]}`}>
                                {template.category}
                              </span>
                              <CardTitle className="break-words text-base leading-snug">{template.name}</CardTitle>
                              {template.description && <CardDescription className="break-words text-sm">{template.description}</CardDescription>}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-destructive"
                              onClick={() => setDeleteId(template.id)}
                              aria-label={`Удалить материал ${template.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 mt-auto">
                          {template.usage && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Когда использовать</p>
                              <p className="text-sm text-muted-foreground">{template.usage}</p>
                            </div>
                          )}
                          <div className="bg-muted rounded-lg p-3 font-mono text-xs whitespace-pre-wrap text-foreground/80 leading-relaxed">
                            {template.content}
                          </div>
                          <TemplateCardFiles template={template} />
                          <div className="flex flex-col gap-3 pt-2 border-t border-border sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-1">
                              {template.format.slice(0, 3).map(f => (
                                <Badge key={f} variant="outline" className="text-xs font-normal">{f}</Badge>
                              ))}
                              {template.format.length > 3 && <Badge variant="outline" className="text-xs font-normal">+{template.format.length - 3}</Badge>}
                            </div>
                            <div className="flex flex-wrap gap-2 sm:justify-end">
                              <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => copyTemplate(template)} data-testid={`button-use-template-${template.id}`}>
                                <Copy className="h-3.5 w-3.5" />Копировать
                              </Button>
                              <Button size="sm" className="gap-1.5 shrink-0" onClick={() => createPublicationFromTemplate(template)} data-testid={`button-create-publication-template-${template.id}`}>
                                <CalendarPlus className="h-3.5 w-3.5" />В план
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddTemplateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить материал?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteTemplate(deleteId!); setDeleteId(null); }}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TemplatesPage() {
  return <Templates />;
}
