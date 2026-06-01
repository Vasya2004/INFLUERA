import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CalendarDays, CheckCircle2, Flag, Lightbulb, Rocket, Send, UserRound } from "lucide-react";
import type { ContentFormat, Platform, PlatformRole, Priority, PublicationStatus } from "@/lib/types";
import { CONTENT_FORMATS, DEFAULT_PUBLICATION_CHECKLIST } from "@/lib/content-plan-utils";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AppLogo } from "@/components/app/logo";

const PLATFORM_OPTIONS = ["Telegram", "Instagram", "YouTube", "TikTok", "VK", "Threads", "X", "Rutube", "LinkedIn", "MAX", "Другое"];
const PRIORITIES: Priority[] = ["высокий", "средний", "низкий"];
const STATUSES: PublicationStatus[] = ["запланировано", "в работе", "готово"];

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function goalDeadlineDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().slice(0, 10);
}

export default function OnboardingPage() {
  const { state, completeOnboarding, syncStatus } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState({
    name: state.profile.name,
    niche: state.profile.niche,
    positioning: state.profile.positioning,
  });
  const [platform, setPlatform] = useState({
    name: "Telegram",
    username: "",
    url: "",
    subscribers: "0",
    targetSubscribers: "1000",
    role: "основная площадка" as PlatformRole,
    weeklyPlan: "3",
  });
  const [goal, setGoal] = useState({
    title: "Первая цель по подписчикам",
    targetValue: "1000",
    deadline: goalDeadlineDate(),
  });
  const [idea, setIdea] = useState({
    title: "",
    description: "",
    format: "пост" as ContentFormat,
    priority: "средний" as Priority,
  });
  const [publication, setPublication] = useState({
    title: "",
    date: tomorrowDate(),
    format: "пост" as ContentFormat,
    status: "запланировано" as PublicationStatus,
    note: "",
  });

  const progress = useMemo(() => Math.round(((step + 1) / 5) * 100), [step]);

  function canContinue() {
    if (step === 0) return Boolean(profile.name.trim() && profile.niche.trim());
    if (step === 1) return Boolean(platform.name && Number(platform.targetSubscribers) > 0);
    if (step === 2) return Boolean(goal.title.trim() && Number(goal.targetValue) > 0 && goal.deadline);
    if (step === 3) return Boolean(idea.title.trim());
    return Boolean(publication.title.trim() && publication.date);
  }

  async function finish() {
    if (!canContinue()) return;
    setSubmitting(true);

    const platformId = genId("p");
    const ideaId = genId("i");
    const publicationId = genId("pub");
    const currentSubscribers = Math.max(0, Number.parseInt(platform.subscribers, 10) || 0);
    const goalTargetSubscribers = Math.max(1, Number.parseInt(goal.targetValue, 10) || 1);

    const firstPlatform: Platform = {
      id: platformId,
      name: platform.name,
      username: platform.username,
      url: platform.url,
      subscribers: currentSubscribers,
      targetSubscribers: goalTargetSubscribers,
      role: platform.role,
      weeklyPlan: Math.max(0, Number.parseInt(platform.weeklyPlan, 10) || 0),
    };

    try {
      await completeOnboarding({
        ...state,
        profile: {
          ...state.profile,
          name: profile.name.trim(),
          niche: profile.niche.trim(),
          positioning: profile.positioning.trim(),
        },
        platforms: [firstPlatform],
        platformMetrics: [{
          id: `m-${platformId}-${new Date().toISOString().slice(0, 10)}`,
          platformId,
          date: new Date().toISOString(),
          subscribers: currentSubscribers,
          notes: "Стартовое значение из onboarding",
        }],
        goals: [{
          id: genId("g"),
          title: goal.title.trim(),
          type: "подписчики",
          currentValue: currentSubscribers,
          targetValue: goalTargetSubscribers,
          deadline: new Date(goal.deadline).toISOString(),
          platformId,
        }],
        ideas: [{
          id: ideaId,
          title: idea.title.trim(),
          description: idea.description.trim(),
          format: idea.format,
          priority: idea.priority,
          status: "превращена в публикацию",
          platformId,
          createdAt: new Date().toISOString(),
        }],
        publications: [{
          id: publicationId,
          title: publication.title.trim(),
          date: new Date(publication.date).toISOString(),
          platformId,
          format: publication.format,
          status: publication.status,
          ideaId,
          note: publication.note.trim() || undefined,
          checklist: DEFAULT_PUBLICATION_CHECKLIST.map(item => ({ ...item })),
          files: [],
        }],
      });
      toast({ title: "Рабочее пространство готово", description: "Onboarding завершён, можно планировать контент." });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Не удалось завершить onboarding",
        description: error instanceof Error ? error.message : "Проверьте синхронизацию и попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <AppLogo showWordmark size="sm" />
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {syncStatus === "saving" ? "Синхронизация…" : "Первичная настройка"}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Настройте Influera</h1>
              <p className="mt-1 text-sm text-muted-foreground">Пять шагов, чтобы сразу открыть рабочий dashboard.</p>
            </div>
            <span className="text-sm font-medium tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <Card>
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {step === 0 && <UserRound className="h-5 w-5" />}
              {step === 1 && <Send className="h-5 w-5" />}
              {step === 2 && <Flag className="h-5 w-5" />}
              {step === 3 && <Lightbulb className="h-5 w-5" />}
              {step === 4 && <CalendarDays className="h-5 w-5" />}
            </div>
            <CardTitle>
              {step === 0 && "Профиль"}
              {step === 1 && "Первая платформа"}
              {step === 2 && "Первая цель"}
              {step === 3 && "Первая идея"}
              {step === 4 && "Первая публикация"}
            </CardTitle>
            <CardDescription>
              {step === 0 && "Укажите имя/бренд и нишу, чтобы рабочее пространство было персональным."}
              {step === 1 && "Добавьте площадку и текущее количество подписчиков."}
              {step === 2 && "Создайте первую цель по подписчикам для выбранной платформы."}
              {step === 3 && "Зафиксируйте первую идею, с которой начнёте контент-план."}
              {step === 4 && "Сразу запланируйте первую публикацию."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Имя / бренд</Label>
                    <Input value={profile.name} onChange={e => setProfile(current => ({ ...current, name: e.target.value }))} placeholder="Иван Иванов" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ниша</Label>
                    <Input value={profile.niche} onChange={e => setProfile(current => ({ ...current, niche: e.target.value }))} placeholder="Дизайн, маркетинг, фитнес..." />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Позиционирование</Label>
                  <Input value={profile.positioning} onChange={e => setProfile(current => ({ ...current, positioning: e.target.value }))} placeholder="Кому и чем вы помогаете" />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Платформа</Label>
                    <Select value={platform.name} onValueChange={value => setPlatform(current => ({ ...current, name: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PLATFORM_OPTIONS.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Роль</Label>
                    <Select value={platform.role} onValueChange={value => setPlatform(current => ({ ...current, role: value as PlatformRole }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="основная площадка">Основная площадка</SelectItem>
                        <SelectItem value="дополнительная">Дополнительная</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Username</Label>
                    <Input value={platform.username} onChange={e => setPlatform(current => ({ ...current, username: e.target.value }))} placeholder="@username" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ссылка</Label>
                    <Input value={platform.url} onChange={e => setPlatform(current => ({ ...current, url: e.target.value }))} placeholder="https://..." />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Сейчас подписчиков</Label>
                    <Input type="number" min={0} value={platform.subscribers} onChange={e => setPlatform(current => ({ ...current, subscribers: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Цель подписчиков</Label>
                    <Input type="number" min={1} value={platform.targetSubscribers} onChange={e => {
                      setPlatform(current => ({ ...current, targetSubscribers: e.target.value }));
                      setGoal(current => ({ ...current, targetValue: e.target.value }));
                    }} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Публикаций в неделю</Label>
                    <Input type="number" min={0} value={platform.weeklyPlan} onChange={e => setPlatform(current => ({ ...current, weeklyPlan: e.target.value }))} />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-1.5">
                  <Label>Название цели</Label>
                  <Input
                    value={goal.title}
                    onChange={e => setGoal(current => ({ ...current, title: e.target.value }))}
                    placeholder={`Вырастить ${platform.name} до ${goal.targetValue}`}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Целевое значение</Label>
                    <Input
                      type="number"
                      min={1}
                      value={goal.targetValue}
                      onChange={e => {
                        setGoal(current => ({ ...current, targetValue: e.target.value }));
                        setPlatform(current => ({ ...current, targetSubscribers: e.target.value }));
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Дедлайн</Label>
                    <Input type="date" value={goal.deadline} onChange={e => setGoal(current => ({ ...current, deadline: e.target.value }))} />
                  </div>
                </div>
                <p className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  Эта цель появится на странице «Цели» и будет участвовать в расчёте общей аудитории на главной.
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-1.5">
                  <Label>Название идеи</Label>
                  <Input value={idea.title} onChange={e => {
                    setIdea(current => ({ ...current, title: e.target.value }));
                    if (!publication.title) setPublication(current => ({ ...current, title: e.target.value }));
                  }} placeholder="Разбор частой ошибки аудитории" />
                </div>
                <div className="space-y-1.5">
                  <Label>Описание</Label>
                  <Textarea rows={3} value={idea.description} onChange={e => setIdea(current => ({ ...current, description: e.target.value }))} placeholder="Коротко опишите мысль и пользу для аудитории" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Формат</Label>
                    <Select value={idea.format} onValueChange={value => {
                      setIdea(current => ({ ...current, format: value as ContentFormat }));
                      setPublication(current => ({ ...current, format: value as ContentFormat }));
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CONTENT_FORMATS.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Приоритет</Label>
                    <Select value={idea.priority} onValueChange={value => setIdea(current => ({ ...current, priority: value as Priority }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-1.5">
                  <Label>Название публикации</Label>
                  <Input value={publication.title} onChange={e => setPublication(current => ({ ...current, title: e.target.value }))} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Дата</Label>
                    <Input type="date" value={publication.date} onChange={e => setPublication(current => ({ ...current, date: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Формат</Label>
                    <Select value={publication.format} onValueChange={value => setPublication(current => ({ ...current, format: value as ContentFormat }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CONTENT_FORMATS.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Статус</Label>
                    <Select value={publication.status} onValueChange={value => setPublication(current => ({ ...current, status: value as PublicationStatus }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Заметка</Label>
                  <Textarea rows={2} value={publication.note} onChange={e => setPublication(current => ({ ...current, note: e.target.value }))} placeholder="Что подготовить перед публикацией" />
                </div>
              </>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" disabled={step === 0 || submitting} onClick={() => setStep(current => Math.max(0, current - 1))}>
                Назад
              </Button>
              {step < 4 ? (
                <Button type="button" disabled={!canContinue()} onClick={() => setStep(current => Math.min(4, current + 1))}>
                  Продолжить
                </Button>
              ) : (
                <Button type="button" className="gap-2" disabled={!canContinue() || submitting} onClick={finish}>
                  {submitting ? "Сохраняем…" : "Открыть dashboard"}
                  {!submitting && <CheckCircle2 className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Rocket className="h-3.5 w-3.5" />
          После завершения вы попадёте в рабочий dashboard с первыми данными.
        </div>
      </div>
    </div>
  );
}
