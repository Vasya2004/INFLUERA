import { describe, expect, it } from "vitest";
import {
  buildCalendarDays,
  filterPlanEntries,
  isPublicationOverdue,
  isViewingCurrentPeriod,
  migrateContentFormat,
  migratePublicationStatus,
  nextSunday,
  parsePublicationChecklist,
} from "./content-plan-utils";
import type { Publication } from "./types";

describe("content plan utilities", () => {
  it("migrates legacy content formats and publication statuses", () => {
    expect(migrateContentFormat("лонгрид")).toBe("пост");
    expect(migrateContentFormat("unknown")).toBe("пост");
    expect(migratePublicationStatus("в подготовке")).toBe("в работе");
    expect(migratePublicationStatus("unknown")).toBe("запланировано");
  });

  it("returns the same day when the source date is Sunday", () => {
    const result = nextSunday(new Date(2026, 4, 24, 10));
    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(24);
    expect(result.getHours()).toBe(12);
  });

  it("builds a full month grid with leading and trailing days", () => {
    const days = buildCalendarDays(new Date(2026, 4, 1), "month");
    expect(days.length % 7).toBe(0);
    expect(days.length).toBeGreaterThanOrEqual(28);
  });

  it("filters overdue publications", () => {
    const publication: Publication = {
      id: "p1",
      title: "Test",
      date: new Date(2020, 0, 1).toISOString(),
      platformId: "pl1",
      format: "пост",
      status: "запланировано",
    };
    expect(isPublicationOverdue(publication, new Date(2026, 4, 1))).toBe(true);
    const filtered = filterPlanEntries(
      [{ kind: "publication", data: publication }],
      {
        status: "все",
        platformId: "все",
        format: "все",
        ideaFilter: "все",
        overdueOnly: true,
        missingUrlOnly: false,
        missingNoteOnly: false,
      },
    );
    expect(filtered).toHaveLength(1);
  });

  it("detects when calendar shows the current month or week", () => {
    const now = new Date(2026, 4, 15);
    expect(isViewingCurrentPeriod(new Date(2026, 4, 1), "month", now)).toBe(true);
    expect(isViewingCurrentPeriod(new Date(2026, 3, 1), "month", now)).toBe(false);
    expect(isViewingCurrentPeriod(new Date(2026, 4, 12), "week", now)).toBe(true);
  });

  it("parses publication checklist metadata", () => {
    const parsed = parsePublicationChecklist({
      items: [{ id: "a", label: "Test", done: false }],
      hook: "Hook",
      caption: "Caption",
    });
    expect(parsed.hook).toBe("Hook");
    expect(parsed.items).toHaveLength(1);
  });
});
