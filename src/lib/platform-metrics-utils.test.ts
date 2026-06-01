import { describe, expect, it } from "vitest";
import type { Platform, PlatformMetric } from "./types";
import {
  calculateMetricGrowth,
  filterMetricsByPeriod,
  getLatestMetricForPlatform,
  getWeeklyPlanSummary,
  metricIdFor,
  validateMetricInput,
} from "./platform-metrics-utils";

describe("platform-metrics-utils", () => {
  const metrics: PlatformMetric[] = [
    { id: "m1", platformId: "p1", date: "2026-05-01T12:00:00.000Z", subscribers: 100 },
    { id: "m2", platformId: "p1", date: "2026-05-15T12:00:00.000Z", subscribers: 150 },
    { id: "m3", platformId: "p1", date: "2026-05-23T12:00:00.000Z", subscribers: 180 },
  ];

  it("validates metric input", () => {
    expect(validateMetricInput(-1, "2026-05-01")).toMatch(/отрицательн/i);
    expect(validateMetricInput(10, "")).toMatch(/дату/i);
  });

  it("builds stable metric ids", () => {
    expect(metricIdFor("p1", "2026-05-01T00:00:00.000Z")).toBe("m-p1-2026-05-01");
  });

  it("calculates growth for a period", () => {
    const growth = calculateMetricGrowth(metrics, 30, new Date("2026-05-23T12:00:00.000Z"));
    expect(growth.start).toBe(100);
    expect(growth.end).toBe(180);
    expect(growth.delta).toBe(80);
  });

  it("filters metrics by period", () => {
    const now = new Date("2026-05-23T12:00:00.000Z");
    const filtered = filterMetricsByPeriod(metrics, 7, now);
    expect(filtered).toHaveLength(1);
    expect(getLatestMetricForPlatform(metrics, "p1")?.subscribers).toBe(180);
  });

  it("summarizes weekly plan completion", () => {
    const platforms: Platform[] = [{
      id: "p1",
      name: "TG",
      username: "@a",
      url: "",
      subscribers: 100,
      targetSubscribers: 200,
      role: "основная площадка",
      weeklyPlan: 2,
    }];
    const summary = getWeeklyPlanSummary(
      platforms,
      [{
        id: "pub1",
        title: "Post",
        date: "2026-05-22T12:00:00.000Z",
        platformId: "p1",
        format: "пост",
        status: "опубликовано",
      }],
      7,
      new Date("2026-05-23T12:00:00.000Z"),
    );
    expect(summary.published).toBe(1);
    expect(summary.planned).toBe(2);
  });
});
