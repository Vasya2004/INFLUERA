import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Goal, GoalType, Platform } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Calendar, Trophy, Star, Trash2 } from "lucide-react";
import { getPrimaryGoal, goalProgress, isSubscriberGoalSynced } from "@/lib/primary-goal";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { EmptyState, PageHeader } from "@/components/app/page";
import { GlowDecor } from "@/components/app/glow-decor";

const GOAL_TYPES: GoalType[] = ["подписчики", "частота публикаций", "доход", "другое"];

const typeColors: Record<GoalType, string> = {
  "подписчики": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  "частота публикаций": "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  "доход": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  "другое": "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
};

function daysLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function InlineEditableValue({
  value,
  onCommit,
  testId,
}: {
  value: number;
  onCommit: (value: number) => void;
  testId?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  function commit() {
    onCommit(Math.max(0, Number.parseInt(draft, 10) || 0));
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className="h-8 w-28 px-2 text-center tabular-nums font-semibold"
        data-testid={testId}
        onClick={e => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); setEditing(true); }}
      className="rounded-md font-semibold tabular-nums text-foreground transition-colors hover:bg-muted/70 hover:underline underline-offset-4"
      title="Нажмите, чтобы изменить"
      data-testid={testId}
    >
      {value.toLocaleString("ru-RU")}
    </button>
  );
}

function subscriberValuesFromPlatform(platform: Platform) {
  return {
    currentValue: String(platform.subscribers),
    targetValue: String(platform.targetSubscribers || 100),
  };
}

function GoalDialog({ open, onClose, goal, platforms }: {
  open: boolean;
  onClose: () => void;
  goal?: Goal;
  platforms: Platform[];
}) {
  const { addGoal, updateGoal } = useStore();
  const [form, setForm] = useState({
    title: "",
    type: "подписчики" as GoalType,
    currentValue: "0",
    targetValue: "100",
    deadline: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    platformId: "none",
  });

  const linkedPlatform = form.platformId !== "none"
    ? platforms.find(p => p.id === form.platformId)
    : undefined;
  const autoFromPlatform = form.type === "подписчики" && Boolean(linkedPlatform) && !goal?.isPrimary;

  useEffect(() => {
    if (!open) return;
    const platformId = goal?.platformId ?? "none";
    const platform = platformId !== "none" ? platforms.find(p => p.id === platformId) : undefined;
    const synced = goal ? isSubscriberGoalSynced(goal) : false;

    setForm({
      title: goal?.title ?? "",
      type: (goal?.type ?? "подписчики") as GoalType,
      currentValue: synced && platform
        ? String(platform.subscribers)
        : goal?.currentValue?.toString() ?? "0",
      targetValue: synced && platform
        ? String(platform.targetSubscribers || goal?.targetValue || 100)
        : goal?.targetValue?.toString() ?? "100",
      deadline: goal?.deadline ? goal.deadline.slice(0, 10) : new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      platformId,
    });
  }, [open, goal, platforms]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function applyPlatformMetrics(platformId: string, type: GoalType = form.type) {
    if (platformId === "none") {
      setForm(f => ({ ...f, platformId: "none" }));
      return;
    }
    if (type !== "подписчики") {
      setForm(f => ({ ...f, platformId }));
      return;
    }
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return;
    const metrics = subscriberValuesFromPlatform(platform);
    setForm(f => ({ ...f, platformId, type, ...metrics }));
  }

  function handleSubmit() {
    if (!form.title || !form.targetValue || !form.deadline) return;
    const data = {
      title: form.title,
      type: form.type,
      currentValue: Number(form.currentValue) || 0,
      targetValue: Number(form.targetValue) || 100,
      deadline: new Date(form.deadline).toISOString(),
      platformId: form.platformId === "none" ? undefined : form.platformId,
    };
    if (goal) updateGoal({ ...goal, ...data, isPrimary: goal.isPrimary });
    else addGoal(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Редактировать цель" : "Новая цель"}</DialogTitle>
          <DialogDescription className="sr-only">
            Задайте название, тип, значения прогресса, дедлайн и связанную платформу.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Название цели</Label>
            <Input placeholder="Вырастить Telegram до 5000" value={form.title} onChange={e => set("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Тип цели</Label>
              <Select value={form.type} onValueChange={v => {
                const type = v as GoalType;
                if (type === "подписчики" && form.platformId !== "none") {
                  applyPlatformMetrics(form.platformId, type);
                } else {
                  setForm(f => ({ ...f, type }));
                }
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Платформа</Label>
              <Select value={form.platformId} onValueChange={v => applyPlatformMetrics(v)}>
                <SelectTrigger><SelectValue placeholder="Не выбрана" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не выбрана</SelectItem>
                  {platforms.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Текущее значение</Label>
              <Input
                type="number"
                min="0"
                value={form.currentValue}
                readOnly={autoFromPlatform}
                className={autoFromPlatform ? "bg-muted/50" : undefined}
                onChange={e => set("currentValue", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Целевое значение</Label>
              <Input
                type="number"
                min="1"
                value={form.targetValue}
                readOnly={autoFromPlatform}
                className={autoFromPlatform ? "bg-muted/50" : undefined}
                onChange={e => set("targetValue", e.target.value)}
              />
            </div>
          </div>
          {autoFromPlatform && linkedPlatform && (
            <p className="text-xs text-muted-foreground">
              Подтягивается из площадки «{linkedPlatform.name}». Измените подписчиков на странице «Площадки».
            </p>
          )}
          <div className="space-y-1.5">
            <Label>Дедлайн</Label>
            <Input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit}>{goal ? "Сохранить" : "Создать цель"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({
  goal,
  index,
  onEdit,
  onDelete,
  platformName,
}: {
  goal: Goal;
  index: number;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
  platformName?: string;
}) {
  const { updateGoal, updatePlatformSubscribers, setAudienceTotal } = useStore();
  const progress = goalProgress(goal);
  const days = daysLeft(goal.deadline);
  const isPrimary = Boolean(goal.isPrimary);
  const canEditCurrent = isPrimary || (goal.type === "подписчики" && Boolean(goal.platformId));

  function commitCurrentValue(next: number) {
    if (isPrimary) {
      setAudienceTotal(next);
      return;
    }
    if (goal.type === "подписчики" && goal.platformId) {
      updatePlatformSubscribers(goal.platformId, next);
      return;
    }
    if (goal.type === "подписчики") {
      updateGoal({ ...goal, currentValue: next });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.07 }}
      data-testid={`card-goal-${goal.id}`}
      className={isPrimary ? "md:col-span-2 lg:col-span-3" : undefined}
    >
      <Card
        className={cn(
          "group flex h-full flex-col transition-colors",
          isPrimary
            ? "border-primary/45 bg-gradient-to-br from-primary/14 via-primary/6 to-transparent shadow-[0_0_44px_hsl(var(--primary)/0.14)] ring-1 ring-primary/25 hover:border-primary/55"
            : "hover:border-primary/40",
        )}
      >
        {isPrimary ? (
          <GlowDecor accent="primary" intensity="strong" />
        ) : (
          <GlowDecor accent="violet" intensity="soft" />
        )}
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {isPrimary && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/35 bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                    <Star className="h-3 w-3 fill-primary" />
                    Главная цель
                  </span>
                )}
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${typeColors[goal.type]}`}>
                  {goal.type}
                </span>
              </div>
              <CardTitle className="text-base leading-snug">{goal.title}</CardTitle>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => onEdit(goal)}
                data-testid={`button-edit-goal-${goal.id}`}
              >
                Изменить
              </Button>
              {!isPrimary && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => onDelete(goal.id)}
                  data-testid={`button-delete-goal-${goal.id}`}
                  aria-label={`Удалить цель ${goal.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative mt-auto space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              {canEditCurrent ? (
                <InlineEditableValue
                  value={goal.currentValue}
                  onCommit={commitCurrentValue}
                  testId={`input-goal-current-${goal.id}`}
                />
              ) : (
                <span className="font-semibold tabular-nums text-foreground">{goal.currentValue.toLocaleString("ru-RU")}</span>
              )}
            </div>
            <Progress value={progress} className={cn("h-2", isPrimary && "[&>div]:bg-primary")} />
            <p className="text-xs text-muted-foreground">{Math.round(progress)}% выполнено</p>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span className={days < 14 && days >= 0 ? "font-medium text-amber-600 dark:text-amber-400" : days < 0 ? "font-medium text-destructive" : ""}>
                {days < 0 ? "Просрочено" : days === 0 ? "Сегодня" : `${days} дн.`}
              </span>
            </div>
            {platformName && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">{platformName}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Goals() {
  const { state, deleteGoal } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const primaryGoal = getPrimaryGoal(state.goals);
  const otherGoals = state.goals.filter(g => !g.isPrimary);

  function openAdd() { setEditGoal(undefined); setDialogOpen(true); }
  function openEdit(g: Goal) { setEditGoal(g); setDialogOpen(true); }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Цели"
        action={
          <Button onClick={openAdd} data-testid="button-add-goal">
            <Plus className="mr-2 h-4 w-4" />Добавить цель
          </Button>
        }
      />

      {state.goals.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Нет активных целей"
          description="Добавьте первую цель, чтобы отслеживать прогресс и понимать, какие площадки требуют внимания."
          actionLabel="Добавить цель"
          onAction={openAdd}
        />
      ) : (
        <div className="space-y-4">
          {primaryGoal && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <GoalCard
                goal={primaryGoal}
                index={0}
                onEdit={openEdit}
                onDelete={setDeleteId}
                platformName={state.platforms.find(p => p.id === primaryGoal.platformId)?.name}
              />
            </div>
          )}

          {otherGoals.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {otherGoals.map((goal, index) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  index={index + (primaryGoal ? 1 : 0)}
                  onEdit={openEdit}
                  onDelete={setDeleteId}
                  platformName={state.platforms.find(p => p.id === goal.platformId)?.name}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <GoalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        goal={editGoal}
        platforms={state.platforms}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить цель?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteGoal(deleteId!); setDeleteId(null); }}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
