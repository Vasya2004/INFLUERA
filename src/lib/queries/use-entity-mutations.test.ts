import { describe, expect, it } from "vitest";
import type { AppState, Platform, PlatformMetric, Publication } from "../types";
import {
  removePublicationFromWorkspace,
  upsertPlatformInWorkspace,
  upsertPublicationInWorkspace,
} from "./use-entity-mutations";

const baseState: AppState = {
  profile: {
    name: "",
    niche: "",
    positioning: "",
    description: "",
    targetAudience: "",
    mainTopics: "",
    rubrics: "",
    tone: "",
    expertise: "",
    opportunities: "",
  },
  platforms: [],
  platformMetrics: [],
  goals: [],
  ideas: [],
  publications: [],
  checkpoints: [],
  templates: [],
};

const publication: Publication = {
  id: "pub1",
  title: "Publication",
  date: "2026-05-24T00:00:00.000Z",
  platformId: "p1",
  format: "пост",
  status: "запланировано",
};

const platform: Platform = {
  id: "p1",
  name: "Telegram",
  username: "@demo",
  url: "",
  subscribers: 10,
  targetSubscribers: 100,
  role: "основная площадка",
  weeklyPlan: 3,
};

describe("entity mutation cache helpers", () => {
  it("adds and updates publications without duplicating ids", () => {
    const added = upsertPublicationInWorkspace(baseState, publication);
    expect(added.publications).toEqual([publication]);

    const updated = upsertPublicationInWorkspace(added, { ...publication, title: "Updated" });
    expect(updated.publications).toHaveLength(1);
    expect(updated.publications[0].title).toBe("Updated");
  });

  it("removes publications from workspace cache", () => {
    const state = { ...baseState, publications: [publication, { ...publication, id: "pub2" }] };
    const next = removePublicationFromWorkspace(state, "pub1");
    expect(next.publications.map(item => item.id)).toEqual(["pub2"]);
  });

  it("adds platform and upserts the related metric", () => {
    const metric: PlatformMetric = {
      id: "m1",
      platformId: "p1",
      date: "2026-05-24T00:00:00.000Z",
      subscribers: 10,
    };

    const added = upsertPlatformInWorkspace(baseState, platform, metric);
    expect(added.platforms).toEqual([platform]);
    expect(added.platformMetrics).toEqual([metric]);

    const updatedMetric = { ...metric, subscribers: 20 };
    const updated = upsertPlatformInWorkspace(added, { ...platform, subscribers: 20 }, updatedMetric);
    expect(updated.platforms).toHaveLength(1);
    expect(updated.platforms[0].subscribers).toBe(20);
    expect(updated.platformMetrics).toEqual([updatedMetric]);
  });
});

