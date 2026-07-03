import { describe, expect, it } from "vitest";
import type { Idea, Publication } from "./types";
import {
  filterIdeas,
  getPublicationsForIdea,
  migrateIdeaStatus,
  parseTagsInput,
  sortIdeas,
} from "./ideas-utils";

const baseIdea = (overrides: Partial<Idea>): Idea => ({
  id: "i1",
  title: "Test",
  description: "",
  format: "пост",
  priority: "средний",
  status: "новая",
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("ideas-utils", () => {
  it("parses tags from comma-separated input", () => {
    expect(parseTagsInput("ux, #карусель; reels")).toEqual(["ux", "карусель", "reels"]);
  });

  it("migrates legacy idea statuses", () => {
    expect(migrateIdeaStatus("в работе")).toBe("сценарий");
    expect(migrateIdeaStatus("архив")).toBe("опубликовано");
    expect(migrateIdeaStatus("монтаж")).toBe("монтаж");
  });

  it("filters ideas by plan state and published status", () => {
    const ideas = [
      baseIdea({ id: "i1", status: "новая" }),
      baseIdea({ id: "i2", status: "опубликовано" }),
    ];
    const publications: Publication[] = [{
      id: "p1",
      title: "Pub",
      date: new Date().toISOString(),
      platformId: "pl1",
      format: "пост",
      status: "запланировано",
      ideaId: "i1",
    }];

    const filtered = filterIdeas(ideas, publications, {
      search: "",
      status: "все",
      priority: "все",
      platformId: "все",
      format: "все",
      inPlan: "в_плане",
      hidePublished: true,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("i1");
    expect(getPublicationsForIdea(publications, "i1")).toHaveLength(1);
  });

  it("sorts ideas by priority", () => {
    const ideas = [
      baseIdea({ id: "low", priority: "низкий" }),
      baseIdea({ id: "high", priority: "высокий" }),
    ];
    const sorted = sortIdeas(ideas, [], "priority");
    expect(sorted[0]?.id).toBe("high");
  });
});
