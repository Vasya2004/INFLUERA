import { useEffect, useMemo, useState } from "react";
import type { Goal, Platform, PlatformMetric } from "@/lib/types";
import {
  type MetricPeriodDays,
  buildMetricChartSeries,
  calculateMetricGrowth,
  getGoalForPlatform,
  getMetricsForPlatform,
  goalProgressForPlatform,
  metricIdFor,
  validateMetricInput,
} from "@/lib/platform-metrics-utils";
import { useStore } from "@/lib/store";
import { AccentProgress } from "@/components/app/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import { SegmentedControl } from "@/components/app/segmented-control";

const PERIOD_OPTIONS: { value: MetricPeriodDays; label: string }[] = [
  { value: 7, label: "7 дней" },
  { value: 30, label: "30 дней" },
  { value: 90, label: "90 дней" },
];

function MetricFormDialog({
  open,
  onClose,
  platformId,
  metric,
}: {
  open: boolean;
  onClose: () => void;
  platformId: string;
  metric?: PlatformMetric;
}) {
  const { upsertPlatformMetric } = useStore();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    subscribers: "0",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      date: metric?.date ? metric.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      subscribers: String(metric?.subscribers ?? 0),
      notes: metric?.notes ?? "",
    });
    setError(null);
  }, [open, metric]);

  function handleSubmit() {
    const subscribers = Number.parseInt(form.subscribers, 10);
    const validationError = validateMetricInput(subscribers, form.date);
    if (validationError) {
      setError(validationError);
      return;
    }

    upsertPlatformMetric({
      id: metric?.id ?? metricIdFor(platformId, new Date(form.date).toISOString()),
      platformId,
      date: new Date(form.date).toISOString(),
      subscribers,
      notes: form.notes.trim() || undefined,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{metric ? "Редактировать метрику" : "Добавить метрику"}</DialogTitle>
          <DialogDescription>Запись подписчиков на конкретную дату.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Дата</Label>
            <Input type="date" value={form.date} onChange={event => setForm(current => ({ ...current, date: event.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Подписчики</Label>
            <Input
              type="number"
              min={0}
              value={form.subscribers}
              onChange={event => setForm(current => ({ ...current, subscribers: event.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Заметка</Label>
            <Textarea
              rows={2}
              placeholder="Например: после Reels про UX"
              value={form.notes}
              onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit}>{metric ? "Сохранить" : "Добавить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PlatformMetricsPanelProps = {
  platform: Platform;
  accent: string;
  goals: Goal[];
};

export function PlatformMetricsPanel({ platform, accent, goals }: PlatformMetricsPanelProps) {
  const { state, removePlatformMetric } = useStore();
  const [period, setPeriod] = useState<MetricPeriodDays>(30);
  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [editMetric, setEditMetric] = useState<PlatformMetric | undefined>();

  const platformMetrics = useMemo(
    () => getMetricsForPlatform(state.platformMetrics, platform.id),
    [state.platformMetrics, platform.id],
  );

  const chartData = useMemo(
    () => buildMetricChartSeries(platformMetrics, period),
    [platformMetrics, period],
  );

  const growth = useMemo(
    () => calculateMetricGrowth(platformMetrics, period),
    [platformMetrics, period],
  );

  const goal = getGoalForPlatform(goals, platform.id);
  const goalProgress = goalProgressForPlatform(platform, goal);

  const history = useMemo(() => {
    return [...platformMetrics].reverse();
  }, [platformMetrics]);

  function openAddMetric() {
    setEditMetric(undefined);
    setMetricDialogOpen(true);
  }

  function openEditMetric(metric: PlatformMetric) {
    setEditMetric(metric);
    setMetricDialogOpen(true);
  }

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="h-4 w-4" style={{ color: accent }} />
            История метрик
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {growth.delta >= 0 ? "+" : ""}{growth.delta.toLocaleString("ru-RU")} за {period} дн.
            {growth.percent !== 0 && ` · ${growth.percent > 0 ? "+" : ""}${growth.percent}%`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            value={String(period)}
            onChange={value => setPeriod(Number(value) as MetricPeriodDays)}
            options={PERIOD_OPTIONS.map(option => ({ value: String(option.value), label: option.label }))}
            aria-label="Период метрик"
          />
          <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={openAddMetric}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Запись
          </Button>
        </div>
      </div>

      {goalProgress && (
        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Цель: {goal?.title}</span>
            <span>{goalProgress.current.toLocaleString("ru-RU")} / {goalProgress.target.toLocaleString("ru-RU")}</span>
          </div>
          <AccentProgress value={goalProgress.percent} accent={accent} className="mt-2 h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            Осталось {goalProgress.remaining.toLocaleString("ru-RU")} подписчиков
          </p>
        </div>
      )}

      {chartData.length >= 2 ? (
        <ChartContainer
          config={{ subscribers: { label: "Подписчики", color: accent } }}
          className="h-[140px] w-full aspect-auto"
        >
          <AreaChart data={chartData} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id={`metric-fill-${platform.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="95%" stopColor={accent} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 5" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} minTickGap={12} tick={{ fontSize: 11 }} />
            <ChartTooltip cursor={{ stroke: accent, strokeWidth: 1, strokeDasharray: "4 4" }} content={<ChartTooltipContent indicator="line" />} />
            <Area
              dataKey="subscribers"
              type="monotone"
              stroke={accent}
              strokeWidth={2}
              fill={`url(#metric-fill-${platform.id})`}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
          Добавьте минимум 2 записи, чтобы увидеть график роста.
        </p>
      )}

      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока нет записей. Нажмите «Обновить подписчиков» или добавьте запись вручную.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Дата</th>
                <th className="px-3 py-2 font-medium">Подписчики</th>
                <th className="px-3 py-2 font-medium">Заметка</th>
                <th className="px-3 py-2 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {history.map(metric => (
                <tr key={metric.id} className="border-t border-border/50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(metric.date).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-3 py-2 font-medium tabular-nums">
                    {metric.subscribers.toLocaleString("ru-RU")}
                  </td>
                  <td className="px-3 py-2 max-w-[200px] truncate text-muted-foreground">
                    {metric.notes ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditMetric(metric)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removePlatformMetric(metric.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MetricFormDialog
        open={metricDialogOpen}
        onClose={() => { setMetricDialogOpen(false); setEditMetric(undefined); }}
        platformId={platform.id}
        metric={editMetric}
      />
    </div>
  );
}
