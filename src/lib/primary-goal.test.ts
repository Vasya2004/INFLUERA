import { describe, expect, it } from "vitest";
import { distributeAudienceTotal, syncAudienceGoals } from "./primary-goal";
import type { Goal, Platform } from "./types";

const platforms: Platform[] = [
  { id: "p1", name: "Telegram", username: "@a", url: "", subscribers: 100, targetSubscribers: 500, role: "основная площадка", weeklyPlan: 3 },
  { id: "p2", name: "YouTube", username: "@b", url: "", subscribers: 300, targetSubscribers: 1500, role: "дополнительная", weeklyPlan: 1 },
];

describe("primary goal helpers", () => {
  it("syncs primary and platform subscriber goals from platform metrics", () => {
    const goals: Goal[] = [
      { id: "primary", title: "All", type: "подписчики", currentValue: 0, targetValue: 1, deadline: "2026-01-01", isPrimary: true },
      { id: "p1-goal", title: "Telegram", type: "подписчики", currentValue: 0, targetValue: 1, deadline: "2026-01-01", platformId: "p1" },
      { id: "other", title: "Other", type: "другое", currentValue: 2, targetValue: 5, deadline: "2026-01-01" },
    ];

    expect(syncAudienceGoals(platforms, goals)).toEqual([
      { ...goals[0], currentValue: 400, targetValue: 2000 },
      { ...goals[1], currentValue: 100, targetValue: 500 },
      goals[2],
      {
        id: "g-platform-p2",
        title: "YouTube до 1 500",
        type: "подписчики",
        currentValue: 300,
        targetValue: 1500,
        deadline: expect.any(String),
        platformId: "p2",
      },
    ]);
  });

  it("distributes a new total by current subscriber share", () => {
    expect(distributeAudienceTotal(platforms, 1000).map(p => p.subscribers)).toEqual([250, 750]);
  });
});
