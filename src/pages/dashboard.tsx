import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Lightbulb } from "lucide-react";
import type { IdeaStatus, Platform, PlatformMetric, Priority, Publication } from "@/lib/types";
import { getAudienceGoalSummary, goalProgress, goalRemaining } from "@/lib/primary-goal";
import {
  getPlatformGrowthLeaderboard,
  getWeeklyPlanSummary,
} from "@/lib/platform-metrics-utils";
import { PUBLICATION_STATUS_COLORS } from "@/lib/content-plan-utils";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { AccentProgress, SectionPanel } from "@/components/app/page";
import { GlowDecor } from "@/components/app/glow-decor";
import { PlatformAvatar, PlatformBuiltinIcon, platformAccent } from "@/components/app/platform-avatar";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Stat3DIcon, type Stat3DIconType } from "@/components/app/stat-3d-icons";

const ideaStatusColors: Record<IdeaStatus, string> = {
  "новая": "border border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "в работе": "border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "превращена в публикацию": "border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "отложена": "border border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  "архив": "border border-border bg-muted/60 text-muted-foreground",
};

const priorityColors: Record<Priority, string> = {
  "высокий": "border border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
  "средний": "border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "низкий": "border border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

type AudiencePeriod = "month" | "year";
type DashboardStat = {
  label: string;
  value: string;
  detail: string;
  illustration: Stat3DIconType;
  href: string;
};

const audiencePeriods: Array<{ value: AudiencePeriod; label: string }> = [
  { value: "month", label: "Месяц" },
  { value: "year", label: "Год" },
];

const glassPanelClass = "glass-card text-foreground";
const glassPanelNestedClass = "glass-card text-foreground";
const mutedTextClass = "text-muted-foreground";
const panelActionLinkClass = "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/12 px-4 py-2 text-sm font-semibold text-primary shadow-[0_0_24px_hsl(var(--primary)/0.16)] transition-colors hover:border-primary/40 hover:bg-primary/18 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildAudienceFallback(labels: string[], audienceCurrent: number, startOffset: number) {
  const startValue = Math.max(0, audienceCurrent - startOffset);
  const growth = audienceCurrent - startValue;

  return labels.map((label, index) => {
    const progress = labels.length > 1 ? index / (labels.length - 1) : 1;
    const curvedProgress = Math.pow(progress, 1.14);

    return {
      label,
      dateKey: label,
      subscribers: Math.round(startValue + growth * curvedProgress),
    };
  });
}

function totalAudienceAtDate(platforms: Platform[], metricsByPlatform: Map<string, PlatformMetric[]>, date: Date) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return platforms.reduce((sum, platform) => {
    const metrics = metricsByPlatform.get(platform.id) ?? [];
    let value = platform.subscribers;

    for (const metric of metrics) {
      if (new Date(metric.date) <= endOfDay) value = metric.subscribers;
      else break;
    }

    return sum + value;
  }, 0);
}

function buildAudienceSeries(
  metrics: PlatformMetric[] | undefined,
  platforms: Platform[],
  audienceCurrent: number,
  period: AudiencePeriod,
) {
  if ((metrics ?? []).length === 0 || platforms.length === 0) {
    return period === "month"
      ? buildAudienceFallback(["1", "5", "10", "15", "20", "25", "30"], audienceCurrent, 420)
      : buildAudienceFallback(["июн", "июл", "авг", "сен", "окт", "ноя", "дек", "янв", "фев", "мар", "апр", "май"], audienceCurrent, 2200);
  }

  const sortedMetrics = [...(metrics ?? [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const metricsByPlatform = new Map<string, PlatformMetric[]>();
  for (const metric of sortedMetrics) {
    const current = metricsByPlatform.get(metric.platformId) ?? [];
    current.push(metric);
    metricsByPlatform.set(metric.platformId, current);
  }

  const now = new Date();

  if (period === "month") {
    const dayOffsets = [29, 24, 19, 14, 9, 4, 0];
    return dayOffsets.map(offset => {
      const date = new Date(now);
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      return {
        label: date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }),
        dateKey: dateKey(date),
        subscribers: offset === 0 ? audienceCurrent : totalAudienceAtDate(platforms, metricsByPlatform, date),
      };
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const monthOffset = 11 - index;
    const date = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0, 12);
    const isCurrentMonth = monthOffset === 0;

    return {
      label: date.toLocaleDateString("ru-RU", { month: "short" }),
      dateKey: dateKey(date),
      subscribers: isCurrentMonth ? audienceCurrent : totalAudienceAtDate(platforms, metricsByPlatform, date),
    };
  });
}

function UpcomingPublicationsList({
  publications,
  platforms,
}: {
  publications: Publication[];
  platforms: ReturnType<typeof useStore>["state"]["platforms"];
}) {
  if (publications.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-sm text-muted-foreground">
        Нет запланированных публикаций
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/70 dark:divide-white/10">
      {publications.map(pub => {
        const platform = platforms.find(p => p.id === pub.platformId);
        const pubDate = new Date(pub.date);
        const isToday = pubDate.toDateString() === new Date().toDateString();
        const day = pubDate.getDate().toString().padStart(2, "0");
        const mon = pubDate.toLocaleString("ru-RU", { month: "short" });

        return (
          <div key={pub.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-primary/[0.035]">
            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg text-center leading-none">
              <div
                className={`flex h-full w-full flex-col items-center justify-center rounded-xl ${isToday ? "bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.30)]" : "border border-border/70 bg-muted/55 text-muted-foreground dark:border-white/10 dark:bg-white/[0.06]"}`}
              >
                <span className="text-[10px] font-medium uppercase opacity-70">{mon}</span>
                <span className="text-sm font-bold">{day}</span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{pub.title}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                {platform && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {platform.iconUrl ? (
                      <img src={platform.iconUrl} alt={platform.name} className="h-3 w-3 rounded object-cover" />
                    ) : (
                      <PlatformBuiltinIcon name={platform.name} className="h-3 w-3" />
                    )}
                    {platform.name}
                  </span>
                )}
                <span className="text-xs text-muted-foreground/35">·</span>
                <span className="text-xs text-muted-foreground">{pub.format}</span>
              </div>
            </div>

            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${PUBLICATION_STATUS_COLORS[pub.status as keyof typeof PUBLICATION_STATUS_COLORS] ?? "border-border bg-muted/60 text-muted-foreground"}`}
            >
              {pub.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { state } = useStore();
  const [audiencePeriod, setAudiencePeriod] = useState<AudiencePeriod>("month");

  const audienceGoal = useMemo(
    () => getAudienceGoalSummary(state.platforms, state.goals),
    [state.platforms, state.goals],
  );
  const audienceCurrent = audienceGoal.currentValue;
  const audienceTarget = audienceGoal.targetValue;
  const subscriberProgress = goalProgress(audienceGoal);
  const audienceRemaining = goalRemaining(audienceGoal);
  const audienceData = useMemo(() => {
    return {
      month: buildAudienceSeries(state.platformMetrics, state.platforms, audienceCurrent, "month"),
      year: buildAudienceSeries(state.platformMetrics, state.platforms, audienceCurrent, "year"),
    };
  }, [audienceCurrent, state.platformMetrics, state.platforms]);

  const platformGrowth = useMemo(
    () => getPlatformGrowthLeaderboard(state.platformMetrics, state.platforms, 30).slice(0, 3),
    [state.platformMetrics, state.platforms],
  );

  const weeklyPlan = useMemo(
    () => getWeeklyPlanSummary(state.platforms, state.publications, 7),
    [state.platforms, state.publications],
  );
  const activeAudienceData = audienceData[audiencePeriod];
  const audienceStart = activeAudienceData[0]?.subscribers ?? audienceCurrent;
  const audienceEnd = activeAudienceData[activeAudienceData.length - 1]?.subscribers ?? audienceCurrent;
  const audienceDelta = Math.max(0, audienceEnd - audienceStart);
  const audienceDeltaPct = audienceStart > 0 ? Math.round((audienceDelta / audienceStart) * 100) : 0;
  const activeGoals = state.goals.filter(g => !g.isPrimary && new Date(g.deadline) > new Date());
  const newIdeas = state.ideas.filter(i => i.status === "новая");
  const upcomingPubs = state.publications
    .filter(p => p.status !== "опубликовано")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);
  const dashboardIdeas = state.ideas
    .filter(i => i.status !== "архив")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const dashboardPlatforms = state.platforms.slice(0, 3);

  const stats: DashboardStat[] = [
    {
      label: "Аудитория",
      value: audienceCurrent.toLocaleString("ru-RU"),
      detail: `${Math.round(subscriberProgress)}% от цели`,
      illustration: "audience",
      href: "/platforms",
    },
    {
      label: "Активных целей",
      value: activeGoals.length.toString(),
      detail: "В процессе выполнения",
      illustration: "goals",
      href: "/goals",
    },
    {
      label: "Банк идей",
      value: state.ideas.length.toString(),
      detail: `${newIdeas.length} новых`,
      illustration: "ideas",
      href: "/ideas",
    },
    {
      label: "В контент-плане",
      value: state.publications.filter(p => p.status !== "опубликовано").length.toString(),
      detail: weeklyPlan.planned > 0
        ? `${weeklyPlan.published}/${weeklyPlan.planned} за 7 дн. · ${weeklyPlan.percent}%`
        : "Публикаций запланировано",
      illustration: "calendar",
      href: "/content-plan",
    },
  ];

  return (
    <div className="space-y-6 text-foreground">
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="pointer-events-none absolute -left-12 -top-16 h-36 w-36 rounded-full bg-primary/14 blur-3xl" />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Главная</h1>
        </div>
      </div>

      {/* Audience (left) + Upcoming publications (right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={`relative min-h-[260px] overflow-hidden rounded-3xl border px-4 py-4 sm:px-5 sm:py-5 ${glassPanelClass}`}>
            <GlowDecor accent="primary" intensity="strong" />

            <div className="relative flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Общая аудитория</p>
                  <div className="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-1">
                    <p className="text-2xl font-bold tracking-tight text-foreground">{audienceCurrent.toLocaleString("ru-RU")}</p>
                    <span className="mb-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-200">
                      +{audienceDelta.toLocaleString("ru-RU")} · {audienceDeltaPct}%
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${mutedTextClass}`}>
                    {Math.round(subscriberProgress)}% от цели {audienceTarget.toLocaleString("ru-RU")}
                  </p>
                </div>

                <div className="inline-flex w-fit rounded-2xl border border-border/70 bg-muted/55 p-1 shadow-[inset_0_1px_0_hsl(0_0%_100%/.08)] dark:border-white/10 dark:bg-white/[0.055]">
                  {audiencePeriods.map(period => (
                    <button
                      key={period.value}
                      type="button"
                      onClick={() => setAudiencePeriod(period.value)}
                      className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors ${
                        audiencePeriod === period.value
                          ? "bg-primary text-primary-foreground shadow-[0_0_22px_hsl(var(--primary)/0.25)]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              <ChartContainer
                config={{
                  subscribers: {
                    label: "Подписчики",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[130px] w-full aspect-auto"
              >
                <AreaChart data={activeAudienceData} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="audience-growth-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.38} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 5" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    minTickGap={12}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="subscribers"
                    name="subscribers"
                    type="monotone"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#audience-growth-fill)"
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  />
                </AreaChart>
              </ChartContainer>

              <div className="grid grid-cols-2 gap-3 border-t border-border/70 pt-3 dark:border-white/10">
                <div>
                  <p className={`text-xs ${mutedTextClass}`}>Площадок</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{state.platforms.length}</p>
                </div>
                <div>
                  <p className={`text-xs ${mutedTextClass}`}>Осталось до цели</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {audienceRemaining.toLocaleString("ru-RU")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <SectionPanel
            title="Ближайшие публикации"
            className={`h-full rounded-3xl ${glassPanelNestedClass}`}
            accent="primary"
            action={
              <Link href="/content-plan" className={panelActionLinkClass}>
                Все
              </Link>
            }
          >
            <UpcomingPublicationsList publications={upcomingPubs} platforms={state.platforms} />
          </SectionPanel>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat, index) => {
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3 }}
            >
              <Link href={stat.href} className="block h-full">
                <div className="glass-card electric-line glass-card-interactive group relative h-full min-h-[150px] overflow-hidden rounded-3xl p-4 cursor-pointer">
                  <GlowDecor accent="primary" intensity="soft" />
                  <div className="relative z-10 flex h-full max-w-[76%] flex-col justify-between gap-7 sm:max-w-[72%]">
                    <span className="text-xs font-medium text-muted-foreground sm:text-sm">{stat.label}</span>
                    <div className="flex flex-col gap-1">
                      <span className="text-3xl font-bold tracking-tight leading-none text-foreground">{stat.value}</span>
                      <span className="text-xs text-muted-foreground sm:text-sm">{stat.detail}</span>
                    </div>
                  </div>
                  <Stat3DIcon
                    type={stat.illustration}
                    className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 opacity-95 drop-shadow-[0_0_32px_rgba(75,163,255,0.18)] transition-transform duration-300 group-hover:scale-105 sm:-bottom-8 sm:-right-8 sm:h-32 sm:w-32"
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {activeGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className={`relative overflow-hidden rounded-3xl border ${glassPanelClass}`}
        >
          <GlowDecor accent="amber" />
          <div className="relative flex items-center justify-between border-b border-border/70 px-5 py-4 dark:border-white/10">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Активные цели</h2>
            </div>
            <Link href="/goals" className={panelActionLinkClass}>
              Все цели
            </Link>
          </div>

          <div className="relative grid divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-white/10">
            {activeGoals.slice(0, 4).map(goal => {
              const pct = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;
              const platform = state.platforms.find(p => p.id === goal.platformId);
              const accent = platform?.accentColor;

              return (
                <div key={goal.id} className="space-y-2.5 px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug text-foreground">{goal.title}</p>
                    {platform && (
                      <span className="shrink-0 rounded-full border border-border/70 bg-muted/55 px-2 py-0.5 text-xs text-muted-foreground dark:border-white/10 dark:bg-white/[0.06]">
                        {platform.name}
                      </span>
                    )}
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: accent ?? "hsl(var(--primary))" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {goal.currentValue.toLocaleString("ru-RU")} / {goal.targetValue.toLocaleString("ru-RU")}
                    </span>
                    <span className="font-medium text-foreground">{Math.round(pct)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Ideas (left) + Platforms (right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <SectionPanel
            title="Идеи"
            className={`h-full rounded-3xl ${glassPanelNestedClass}`}
            accent="violet"
            action={
              <Link href="/ideas" className={panelActionLinkClass}>
                Все
              </Link>
            }
          >
            {dashboardIdeas.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <p className="text-sm text-muted-foreground">Пока нет идей — добавьте первую на странице «Идеи»</p>
              </div>
            ) : (
              <div className="divide-y divide-border/70 dark:divide-white/10">
                {dashboardIdeas.map(idea => {
                  const platform = state.platforms.find(p => p.id === idea.platformId);

                  return (
                    <Link
                      key={idea.id}
                      href="/ideas"
                      className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-primary/[0.035]"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <Lightbulb className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{idea.title}</p>
                        {idea.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{idea.description}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${ideaStatusColors[idea.status]}`}>
                            {idea.status}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityColors[idea.priority]}`}>
                            {idea.priority}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{idea.format}</span>
                          {platform && (
                            <>
                              <span className="text-muted-foreground/35 text-[11px]">·</span>
                              <span className="text-[11px] text-muted-foreground">{platform.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionPanel>
        </motion.div>

        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <SectionPanel
            title="Платформы"
            className={`h-full rounded-3xl ${glassPanelNestedClass}`}
            accent="emerald"
            action={
              <Link href="/platforms" className={panelActionLinkClass}>
                Все
              </Link>
            }
          >
            <div className="divide-y divide-border/70 px-5 py-2 dark:divide-white/10">
              {dashboardPlatforms.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Нет платформ</div>
              ) : (
                (platformGrowth.length > 0 ? platformGrowth : state.platforms.slice(0, 3).map(platform => ({
                  platform,
                  growth: { delta: 0, percent: 0 },
                }))).map(({ platform, growth }) => {
                  const pct = platform.targetSubscribers > 0
                    ? Math.min((platform.subscribers / platform.targetSubscribers) * 100, 100)
                    : 0;
                  const accent = platformAccent(platform);

                  return (
                    <div key={platform.id} className="space-y-2 py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <PlatformAvatar platform={platform} size="sm" />
                          <span className="text-sm font-medium text-foreground">{platform.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {platform.subscribers.toLocaleString("ru-RU")} / {platform.targetSubscribers.toLocaleString("ru-RU")}
                          </span>
                          {growth.delta !== 0 && (
                            <p className="text-[11px] font-medium tabular-nums" style={{ color: growth.delta > 0 ? accent : undefined }}>
                              {growth.delta > 0 ? "+" : ""}{growth.delta.toLocaleString("ru-RU")} за 30 дн.
                            </p>
                          )}
                        </div>
                      </div>
                      <AccentProgress value={pct} accent={accent} className="h-1" />
                    </div>
                  );
                })
              )}
            </div>
          </SectionPanel>
        </motion.div>
      </div>
    </div>
  );
}
