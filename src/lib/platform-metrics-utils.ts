import type { Goal, Platform, PlatformMetric, Publication } from "./types";

export type MetricPeriodDays = 7 | 30 | 90;

export type MetricChartPoint = {
  label: string;
  dateKey: string;
  subscribers: number;
};

export type MetricGrowthSummary = {
  start: number;
  end: number;
  delta: number;
  percent: number;
};

export function validateMetricInput(subscribers: number, date: string) {
  if (!date) return "Укажите дату";
  if (!Number.isFinite(subscribers) || subscribers < 0) return "Подписчики не могут быть отрицательными";
  return null;
}

export function metricIdFor(platformId: string, date: string) {
  return `m-${platformId}-${date.slice(0, 10)}`;
}

export function getMetricsForPlatform(metrics: PlatformMetric[] | undefined, platformId: string) {
  return (metrics ?? [])
    .filter(metric => metric.platformId === platformId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getLatestMetricForPlatform(metrics: PlatformMetric[] | undefined, platformId: string) {
  const items = getMetricsForPlatform(metrics, platformId);
  return items[items.length - 1];
}

export function filterMetricsByPeriod(metrics: PlatformMetric[], periodDays: MetricPeriodDays, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (periodDays - 1));

  return metrics.filter(metric => {
    const date = new Date(metric.date);
    date.setHours(0, 0, 0, 0);
    return date >= start;
  });
}

export function buildMetricChartSeries(metrics: PlatformMetric[], periodDays: MetricPeriodDays): MetricChartPoint[] {
  const filtered = filterMetricsByPeriod(metrics, periodDays);
  if (filtered.length === 0) return [];

  return filtered.map(metric => ({
    label: new Date(metric.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }),
    dateKey: metric.date.slice(0, 10),
    subscribers: metric.subscribers,
  }));
}

export function calculateMetricGrowth(metrics: PlatformMetric[], periodDays: MetricPeriodDays, now = new Date()): MetricGrowthSummary {
  const filtered = filterMetricsByPeriod(metrics, periodDays, now);
  if (filtered.length === 0) {
    return { start: 0, end: 0, delta: 0, percent: 0 };
  }

  const start = filtered[0]?.subscribers ?? 0;
  const end = filtered[filtered.length - 1]?.subscribers ?? 0;
  const delta = end - start;
  const percent = start > 0 ? Math.round((delta / start) * 100) : (end > 0 ? 100 : 0);

  return { start, end, delta, percent };
}

export function buildAggregatedAudienceSeries(
  metrics: PlatformMetric[] | undefined,
  periodDays: MetricPeriodDays,
): MetricChartPoint[] {
  const totals = new Map<string, number>();
  const filtered = filterMetricsByPeriod(metrics ?? [], periodDays);

  for (const metric of filtered) {
    const key = metric.date.slice(0, 10);
    totals.set(key, (totals.get(key) ?? 0) + metric.subscribers);
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, subscribers]) => ({
      dateKey,
      label: new Date(dateKey).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }),
      subscribers,
    }));
}

export function syncPlatformSubscribersFromMetrics(platforms: Platform[], metrics: PlatformMetric[] | undefined) {
  return platforms.map(platform => {
    const latest = getLatestMetricForPlatform(metrics, platform.id);
    if (!latest) return platform;
    return { ...platform, subscribers: latest.subscribers };
  });
}

export function getGoalForPlatform(goals: Goal[], platformId: string) {
  return goals.find(goal => goal.platformId === platformId && goal.type === "подписчики");
}

export function goalProgressForPlatform(platform: Platform, goal?: Goal) {
  if (!goal || goal.targetValue <= 0) return null;
  const current = platform.subscribers;
  const percent = Math.min(Math.round((current / goal.targetValue) * 100), 100);
  const remaining = Math.max(0, goal.targetValue - current);
  return { current, target: goal.targetValue, percent, remaining };
}

export function getTotalAudience(metrics: PlatformMetric[] | undefined, platforms: Platform[]) {
  if ((metrics ?? []).length > 0) {
    const latestByPlatform = new Map<string, number>();
    for (const platform of platforms) {
      const latest = getLatestMetricForPlatform(metrics, platform.id);
      latestByPlatform.set(platform.id, latest?.subscribers ?? platform.subscribers);
    }
    return [...latestByPlatform.values()].reduce((sum, value) => sum + value, 0);
  }
  return platforms.reduce((sum, platform) => sum + platform.subscribers, 0);
}

export function getPlatformGrowthLeaderboard(
  metrics: PlatformMetric[] | undefined,
  platforms: Platform[],
  periodDays: MetricPeriodDays = 30,
) {
  return platforms
    .map(platform => {
      const platformMetrics = getMetricsForPlatform(metrics, platform.id);
      const growth = calculateMetricGrowth(platformMetrics, periodDays);
      return { platform, growth };
    })
    .sort((a, b) => b.growth.delta - a.growth.delta);
}

export function getWeeklyPlanSummary(
  platforms: Platform[],
  publications: Publication[],
  periodDays = 7,
  now = new Date(),
) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (periodDays - 1));

  const published = publications.filter(publication => {
    if (publication.status !== "опубликовано") return false;
    const date = new Date(publication.date);
    date.setHours(0, 0, 0, 0);
    return date >= start;
  }).length;

  const weeks = periodDays / 7;
  const planned = Math.round(platforms.reduce((sum, platform) => sum + platform.weeklyPlan, 0) * weeks);
  const percent = planned > 0 ? Math.min(Math.round((published / planned) * 100), 999) : 0;

  return { published, planned, percent, periodDays };
}

export function createDemoPlatformMetrics(platforms: Platform[]): PlatformMetric[] {
  const metrics: PlatformMetric[] = [];

  for (const platform of platforms) {
    const offsets = [28, 21, 14, 7, 0];
    for (const offset of offsets) {
      const date = new Date();
      date.setDate(date.getDate() - offset);
      date.setHours(12, 0, 0, 0);
      const progress = 1 - offset / 30;
      const subscribers = Math.max(
        0,
        Math.round(platform.subscribers * (0.72 + progress * 0.28)),
      );
      metrics.push({
        id: metricIdFor(platform.id, date.toISOString()),
        platformId: platform.id,
        date: date.toISOString(),
        subscribers: offset === 0 ? platform.subscribers : subscribers,
        notes: offset === 0 ? "Текущее значение" : undefined,
      });
    }
  }

  return metrics;
}
