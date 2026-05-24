import { describe, expect, it } from "vitest";
import { parseAppState } from "./app-state-schema";

function validWorkspace() {
  return {
    platforms: [
      { id: "p1", name: "Telegram", username: "@a", url: "", subscribers: 10, targetSubscribers: 100, role: "основная площадка", weeklyPlan: 3 },
    ],
    goals: [
      { id: "g1", title: "Goal", type: "подписчики", currentValue: 10, targetValue: 100, deadline: "2026-01-01", platformId: "p1" },
    ],
    ideas: [
      { id: "i1", title: "Idea", description: "Desc", format: "лонгрид", priority: "средний", status: "новая", createdAt: "2026-01-01" },
    ],
    publications: [
      { id: "pub1", title: "Publication", date: "2026-01-01", platformId: "p1", format: "пост", status: "в подготовке" },
    ],
    templates: [
      { id: "t1", name: "Template", category: "сценарий", format: ["пост"], description: "Desc", usage: "Use", content: "Content" },
    ],
    profile: {
      name: "Name",
      niche: "Niche",
      positioning: "Positioning",
      description: "Description",
      targetAudience: "Audience",
      mainTopics: "Topics",
      rubrics: "Rubrics",
      tone: "Tone",
      expertise: "Expertise",
      opportunities: "Opportunities",
    },
  };
}

describe("app state schema", () => {
  it("accepts a valid workspace and defaults missing checkpoints", () => {
    const parsed = parseAppState(validWorkspace());
    expect(parsed?.checkpoints).toEqual([]);
    expect(parsed?.platforms[0].id).toBe("p1");
  });

  it("rejects malformed workspace data", () => {
    expect(parseAppState({ ...validWorkspace(), platforms: "bad" })).toBeNull();
    expect(parseAppState(null)).toBeNull();
  });
});
