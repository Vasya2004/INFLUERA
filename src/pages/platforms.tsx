import { useEffect, useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { Platform, PlatformRole } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, ExternalLink, Trash2, Share2, RefreshCw, Upload, X, Copy, Star } from "lucide-react";
import { motion } from "framer-motion";
import { AccentProgress, EmptyState, PageHeader } from "@/components/app/page";
import { PlatformAvatar, platformAccent, platformBorder, platformTint } from "@/components/app/platform-avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getAvailableMirrorCandidates,
  getMirrorPlatforms,
  isMainPlatform,
  PLATFORM_ROLES,
  ROLE_LABELS,
} from "@/lib/platform-utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const PLATFORM_NAMES = ["Telegram", "Instagram", "YouTube", "TikTok", "VK", "Threads", "X", "Rutube", "LinkedIn", "MAX", "Другое"];

const DEFAULT_ACCENT: Record<string, string> = {
  Telegram: "#0088cc",
  Instagram: "#E1306C",
  YouTube: "#FF0000",
  TikTok: "#010101",
  VK: "#4C75A3",
  Threads: "#000000",
  X: "#000000",
  LinkedIn: "#0077B5",
  Rutube: "#FF3A44",
  MAX: "#0057FF",
  Другое: "#6366f1",
};

const PRESET_COLORS = [
  "#0088cc", "#E1306C", "#FF0000", "#4C75A3",
  "#010101", "#0077B5", "#FF3A44", "#6366f1",
  "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
];

const SUBSCRIBER_STEPS = [10, 50, 100] as const;
const ICON_MAX_BYTES = 1024 * 1024;
const ICON_ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml", "image/webp"]);

function PlatformQuickSubscribersDialog({
  open,
  onClose,
  platform,
}: {
  open: boolean;
  onClose: () => void;
  platform: Platform | null;
}) {
  const { updatePlatformSubscribers } = useStore();
  const [draft, setDraft] = useState("0");

  useEffect(() => {
    if (open && platform) setDraft(String(platform.subscribers));
  }, [open, platform]);

  if (!platform) return null;

  const activePlatform = platform;
  const draftNum = Math.max(0, Number.parseInt(draft, 10) || 0);
  const progress = activePlatform.targetSubscribers > 0
    ? Math.min((draftNum / activePlatform.targetSubscribers) * 100, 100)
    : 0;
  const accent = platformAccent(activePlatform);

  function apply() {
    updatePlatformSubscribers(activePlatform.id, draftNum);
    onClose();
  }

  function bump(delta: number) {
    setDraft(String(Math.max(0, draftNum + delta)));
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Обновить подписчиков</DialogTitle>
          <DialogDescription className="text-left">
            {activePlatform.name} · {activePlatform.username}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUBSCRIBER_STEPS.map(step => (
              <Button key={`m-${step}`} type="button" variant="outline" size="sm" onClick={() => bump(-step)}>
                −{step}
              </Button>
            ))}
          </div>

          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="h-12 text-center text-2xl font-bold tabular-nums"
            data-testid="input-platform-quick-subscribers"
          />

          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUBSCRIBER_STEPS.map(step => (
              <Button key={`p-${step}`} type="button" variant="outline" size="sm" onClick={() => bump(step)}>
                +{step}
              </Button>
            ))}
          </div>

          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/30 p-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Цель</span>
              <span className="font-medium text-foreground">{activePlatform.targetSubscribers.toLocaleString("ru-RU")}</span>
            </div>
            <AccentProgress value={progress} accent={accent} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.round(progress)}% от цели</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={apply} data-testid="button-apply-platform-quick-subscribers">Применить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getPlatformForm(platform?: Platform) {
  return {
    name: platform?.name ?? "Telegram",
    username: platform?.username ?? "",
    url: platform?.url ?? "",
    subscribers: platform?.subscribers?.toString() ?? "0",
    goalEnabled: Boolean(platform?.targetSubscribers && platform.targetSubscribers > 0),
    targetSubscribers: platform?.targetSubscribers && platform.targetSubscribers > 0 ? platform.targetSubscribers.toString() : "1000",
    role: (platform?.role ?? "дополнительная") as PlatformRole,
    weeklyPlan: platform?.weeklyPlan?.toString() ?? "3",
    accentColor: platform?.accentColor ?? DEFAULT_ACCENT[platform?.name ?? "Telegram"] ?? DEFAULT_ACCENT["Telegram"],
    iconUrl: platform?.iconUrl ?? "",
    mirrorPlatformIds: platform?.mirrorPlatformIds ?? [],
  };
}

function platformSurface(color: string, amount = 7) {
  return `color-mix(in srgb, ${color} ${amount}%, hsl(var(--card)))`;
}

function IconUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ICON_ALLOWED_TYPES.has(file.type)) {
      toast({
        title: "Неподдерживаемый формат",
        description: "Загрузите PNG, JPG, SVG или WebP.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    if (file.size > ICON_MAX_BYTES) {
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер иконки — 1 МБ.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      onChange(result);
      if (inputRef.current) inputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <Label>Иконка платформы</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border shrink-0">
            <img src={value} alt="icon" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="h-14 w-14 rounded-xl border-2 border-dashed border-border flex items-center justify-center shrink-0 text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {value ? "Заменить иконку" : "Загрузить иконку"}
          </Button>
          <p className="text-xs text-muted-foreground">PNG, JPG, SVG до 1 МБ. Хранится в браузере.</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Акцентный цвет</Label>
      <div className="flex items-center gap-2 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            className="h-7 w-7 rounded-full border-2 transition-all"
            style={{
              background: c,
              borderColor: value === c ? c : "transparent",
              boxShadow: value === c ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${c}` : "none",
            }}
          />
        ))}
        <div className="relative">
          <label className="h-7 w-7 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden" title="Выбрать цвет">
            <span className="text-[10px] text-muted-foreground font-bold">+</span>
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>
        <div
          className="h-7 px-2.5 rounded-full border border-border text-xs font-mono flex items-center gap-1.5 text-muted-foreground"
        >
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: value }} />
          {value.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function MirrorPlatformPicker({
  candidates,
  selectedIds,
  onChange,
  accentColor,
}: {
  candidates: Platform[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  accentColor: string;
}) {
  if (candidates.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
        Нет доступных дополнительных площадок. Добавьте их с ролью «Дополнительная».
      </p>
    );
  }

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id],
    );
  }

  return (
    <div className="space-y-2">
      {candidates.map(candidate => {
        const checked = selectedIds.includes(candidate.id);
        const accent = platformAccent(candidate);

        return (
          <label
            key={candidate.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
              checked ? "border-primary/40 bg-primary/5" : "border-border/70 hover:bg-muted/40",
            )}
            style={checked ? { borderColor: platformBorder(accentColor, 40), background: platformTint(accentColor, 8) } : undefined}
          >
            <Checkbox checked={checked} onCheckedChange={() => toggle(candidate.id)} />
            <PlatformAvatar platform={candidate} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{candidate.name}</p>
              <p className="truncate text-xs text-muted-foreground">{candidate.username}</p>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: platformTint(accent, 12), color: accent }}
            >
              дубль
            </span>
          </label>
        );
      })}
    </div>
  );
}

function PlatformDialog({ open, onClose, platform, allPlatforms }: {
  open: boolean;
  onClose: () => void;
  platform?: Platform;
  allPlatforms: Platform[];
}) {
  const { addPlatform, updatePlatform } = useStore();
  const [form, setForm] = useState(() => getPlatformForm(platform));

  useEffect(() => {
    if (open) setForm(getPlatformForm(platform));
  }, [open, platform]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setBoolean = (k: string, v: boolean) => setForm((f) => ({ ...f, [k]: v }));
  const isMain = isMainPlatform({ role: form.role });
  const mirrorCandidates = getAvailableMirrorCandidates(allPlatforms, platform?.id);

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      accentColor: f.accentColor === DEFAULT_ACCENT[f.name] ? (DEFAULT_ACCENT[name] ?? "#6366f1") : f.accentColor,
    }));
  }

  function handleSubmit() {
    const username = form.username.trim();
    if (!username) return;
    const data = {
      name: form.name,
      username,
      url: form.url.trim() || `https://${form.name.toLowerCase()}.com/${username.replace("@", "")}`,
      subscribers: Number(form.subscribers) || 0,
      targetSubscribers: isMain && form.goalEnabled ? Number(form.targetSubscribers) || 1000 : 0,
      role: form.role,
      weeklyPlan: Number(form.weeklyPlan) || 1,
      accentColor: form.accentColor,
      iconUrl: form.iconUrl || undefined,
      iconStoragePath: form.iconUrl && form.iconUrl === platform?.iconUrl ? platform.iconStoragePath : undefined,
      mirrorPlatformIds: isMain && form.mirrorPlatformIds.length > 0 ? form.mirrorPlatformIds : undefined,
    };
    if (platform) updatePlatform({ ...platform, ...data });
    else addPlatform(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{platform ? "Редактировать платформу" : "Добавить платформу"}</DialogTitle>
          <DialogDescription className="sr-only">
            Настройте площадку, роль, ссылку, текущую аудиторию, цель и визуальный стиль.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Icon upload */}
          <IconUploader value={form.iconUrl} onChange={(v) => set("iconUrl", v)} />

          {/* Color picker */}
          <ColorPicker value={form.accentColor} onChange={(v) => set("accentColor", v)} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Платформа</Label>
              <Select value={form.name} onValueChange={handleNameChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <div
                className="rounded-xl border transition-colors"
                style={isMain ? {
                  background: platformTint(form.accentColor, 10),
                  borderColor: platformBorder(form.accentColor, 38),
                } : undefined}
              >
                <Select
                  value={form.role}
                  onValueChange={(v) => {
                    const nextRole = v as PlatformRole;
                    setForm(f => ({
                      ...f,
                      role: nextRole,
                      goalEnabled: nextRole === "основная площадка" ? f.goalEnabled : false,
                      mirrorPlatformIds: nextRole === "основная площадка" ? f.mirrorPlatformIds : [],
                    }));
                  }}
                >
                  <SelectTrigger className={isMain ? "border-transparent bg-transparent shadow-none" : undefined}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_ROLES.map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isMain && (
            <div
              className="space-y-2 rounded-xl border p-3"
              style={{
                background: platformTint(form.accentColor, 6),
                borderColor: platformBorder(form.accentColor, 28),
              }}
            >
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4" style={{ color: form.accentColor }} />
                <div>
                  <Label className="text-sm">Дублирование контента</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Выберите дополнительные площадки, куда копируется контент с основной
                  </p>
                </div>
              </div>
              <MirrorPlatformPicker
                candidates={mirrorCandidates}
                selectedIds={form.mirrorPlatformIds}
                onChange={ids => setForm(f => ({ ...f, mirrorPlatformIds: ids }))}
                accentColor={form.accentColor}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Имя пользователя / ник</Label>
            <Input placeholder="@myblog" value={form.username} onChange={(e) => set("username", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ссылка <span className="text-muted-foreground text-xs">(необязательно)</span></Label>
            <Input placeholder="https://t.me/myblog" value={form.url} onChange={(e) => set("url", e.target.value)} />
          </div>

          <div className={cn("grid gap-3", isMain && form.goalEnabled ? "grid-cols-2" : "grid-cols-1")}>
            <div className="space-y-1.5">
              <Label>Подписчиков сейчас</Label>
              <Input type="number" min="0" value={form.subscribers} onChange={(e) => set("subscribers", e.target.value)} />
            </div>
            {isMain && form.goalEnabled && (
              <div className="space-y-1.5">
                <Label>Цель по подписчикам</Label>
                <Input type="number" min="1" value={form.targetSubscribers} onChange={(e) => set("targetSubscribers", e.target.value)} />
              </div>
            )}
          </div>

          {isMain && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/35">
              <Checkbox
                checked={form.goalEnabled}
                onCheckedChange={checked => setBoolean("goalEnabled", checked === true)}
                className="mt-0.5"
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium text-foreground">Добавить цель по подписчикам</span>
                <span className="block text-xs leading-relaxed text-muted-foreground">
                  Если включено, цель появится на странице «Цели» и будет учитываться в общей аудитории.
                </span>
              </span>
            </label>
          )}

          <div className="space-y-1.5">
            <Label>Публикаций в неделю</Label>
            <Input type="number" min="0" max="30" value={form.weeklyPlan} onChange={(e) => set("weeklyPlan", e.target.value)} />
          </div>

          {/* Preview */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Предпросмотр карточки</Label>
            <div
              className="rounded-xl border-2 p-4 flex flex-col gap-3 transition-colors"
              style={{
                borderColor: platformBorder(form.accentColor, isMain ? 42 : 34),
                background: isMain ? platformSurface(form.accentColor, 9) : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <PlatformAvatar
                  platform={{ name: form.name, iconUrl: form.iconUrl, accentColor: form.accentColor }}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{form.name || "Название"}</p>
                  <p className="text-xs text-muted-foreground">{form.username || "@username"}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                    isMain && "ring-1",
                  )}
                  style={{
                    background: platformTint(form.accentColor, isMain ? 16 : 12),
                    color: form.accentColor,
                  }}
                >
                  {isMain && <Star className="h-3 w-3 fill-current" />}
                  {ROLE_LABELS[form.role]}
                </span>
              </div>
              {isMain && form.mirrorPlatformIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t border-border/50 pt-3">
                  {form.mirrorPlatformIds.map(id => {
                    const mirror = allPlatforms.find(p => p.id === id);
                    if (!mirror) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/70 px-2 py-1 text-[11px]"
                      >
                        <PlatformAvatar platform={mirror} size="xs" />
                        <Copy className="h-3 w-3 text-muted-foreground" />
                        {mirror.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit}>{platform ? "Сохранить" : "Добавить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Platforms({ embedded = false }: { embedded?: boolean }) {
  const { state, deletePlatform } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPlatform, setEditPlatform] = useState<Platform | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [quickSubscribersPlatform, setQuickSubscribersPlatform] = useState<Platform | null>(null);

  function openAdd() { setEditPlatform(undefined); setDialogOpen(true); }
  function openEdit(p: Platform) { setEditPlatform(p); setDialogOpen(true); }
  function openQuickSubscribers(p: Platform) { setQuickSubscribersPlatform(p); }
  function closeDialog() {
    setDialogOpen(false);
    setEditPlatform(undefined);
  }

  return (
    <div className={cn("space-y-8", embedded && "space-y-5")}>
      {!embedded && (
        <PageHeader
          title="Платформы"
          action={
            <Button onClick={openAdd} className="w-full sm:w-auto" data-testid="button-add-platform">
            <Plus className="mr-2 h-4 w-4" />Добавить платформу
            </Button>
          }
        />
      )}
      {embedded && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight sm:text-lg">Платформы</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Площадки, аудитория, цели роста и ритм публикаций.
            </p>
          </div>
          <Button onClick={openAdd} className="w-full sm:w-auto" data-testid="button-add-platform">
            <Plus className="mr-2 h-4 w-4" />Добавить платформу
          </Button>
        </div>
      )}

      {state.platforms.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="Нет платформ"
          description="Добавьте первую площадку для отслеживания роста аудитории и контент-ритма."
          actionLabel="Добавить платформу"
          onAction={openAdd}
        />
      ) : (
        <div className="grid gap-4">
          {state.platforms.map((platform, index) => {
            const hasGoal = platform.targetSubscribers > 0;
            const progress = platform.targetSubscribers > 0
              ? Math.min((platform.subscribers / platform.targetSubscribers) * 100, 100)
              : 0;
            const accent = platformAccent(platform);
            const main = isMainPlatform(platform);
            const mirrors = getMirrorPlatforms(state.platforms, platform);

            return (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                data-testid={`card-platform-${platform.id}`}
              >
                <Card
                  className={cn(
                    "group relative overflow-hidden transition-all duration-200 hover:shadow-md",
                    main ? "hover:border-primary/20" : "hover:border-primary/30",
                  )}
                  style={main ? {
                    background: platformSurface(accent, 8),
                    borderColor: platformBorder(accent, 32),
                  } : undefined}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ background: accent }}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlatformAvatar platform={platform} size="md" />
                        <div>
                          <CardTitle className="text-base leading-tight">{platform.name}</CardTitle>
                          {platform.url ? (
                            <a
                              href={platform.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mt-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {platform.username}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">{platform.username}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                            main && "ring-1",
                          )}
                          style={{
                            background: platformTint(accent, main ? 14 : 10),
                            color: accent,
                            boxShadow: main ? `inset 0 0 0 1px ${platformBorder(accent, 45)}` : undefined,
                          }}
                        >
                          {main && <Star className="h-3 w-3 fill-current" />}
                          {ROLE_LABELS[platform.role]}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteId(platform.id)}
                            data-testid={`button-delete-platform-${platform.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="sm:col-span-2 space-y-3">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Подписчиков</p>
                            <p className="text-2xl font-bold">{platform.subscribers.toLocaleString("ru-RU")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Цель</p>
                            <p className="text-sm font-medium">
                              {hasGoal ? platform.targetSubscribers.toLocaleString("ru-RU") : "Не задана"}
                            </p>
                          </div>
                        </div>

                        {/* Colored progress bar */}
                        {hasGoal ? (
                          <>
                            <AccentProgress value={progress} accent={accent} className="h-2" />
                            <p className="text-xs text-muted-foreground">{Math.round(progress)}% от цели</p>
                          </>
                        ) : (
                          <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                            Цель по подписчикам не добавлена.
                          </p>
                        )}

                        {main && mirrors.length > 0 && (
                          <div className="rounded-xl border border-border/60 bg-background/50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Copy className="h-3.5 w-3.5" style={{ color: accent }} />
                              Дублирование контента
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {mirrors.map(mirror => (
                                <span
                                  key={mirror.id}
                                  className="inline-flex items-center gap-2 rounded-lg border border-border/70 px-2 py-1.5 text-xs"
                                  style={{ borderColor: platformBorder(platformAccent(mirror), 22) }}
                                >
                                  <PlatformAvatar platform={mirror} size="xs" />
                                  <span className="font-medium">{mirror.name}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>

                      <div className="sm:pl-6 sm:border-l border-border flex flex-col gap-2.5">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Публикаций в неделю</p>
                          <p className="text-sm font-semibold">{platform.weeklyPlan}</p>
                        </div>
                        <Button
                          className="mt-auto h-11 w-full gap-2 text-sm font-medium"
                          onClick={() => openQuickSubscribers(platform)}
                          style={{ background: accent, color: "#fff" }}
                          data-testid={`button-quick-subscribers-${platform.id}`}
                        >
                          Обновить подписчиков
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 w-full gap-2 text-sm text-foreground hover:text-foreground"
                          onClick={() => openEdit(platform)}
                          style={{ borderColor: platformBorder(accent, 22) }}
                          data-testid={`button-update-${platform.id}`}
                        >
                          <RefreshCw className="h-3.5 w-3.5" style={{ color: accent }} />
                          Редактировать площадку
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <PlatformQuickSubscribersDialog
        open={!!quickSubscribersPlatform}
        onClose={() => setQuickSubscribersPlatform(null)}
        platform={quickSubscribersPlatform}
      />

      <PlatformDialog open={dialogOpen} onClose={closeDialog} platform={editPlatform} allPlatforms={state.platforms} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить платформу?</AlertDialogTitle>
            <AlertDialogDescription>Платформа будет удалена. Связанные цели и публикации останутся.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deletePlatform(deleteId!); setDeleteId(null); }}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function PlatformsPage() {
  return <Platforms />;
}
