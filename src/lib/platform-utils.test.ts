import { describe, expect, it } from "vitest";
import { sanitizePlatforms } from "./platform-utils";
import type { Platform } from "./types";

describe("platform utilities", () => {
  it("keeps mirror ids only on main platforms and only for extra platforms", () => {
    const platforms: Platform[] = [
      { id: "main", name: "Telegram", username: "", url: "", subscribers: 1, targetSubscribers: 10, role: "основная площадка", weeklyPlan: 3, mirrorPlatformIds: ["extra", "main", "missing"] },
      { id: "extra", name: "Instagram", username: "", url: "", subscribers: 1, targetSubscribers: 10, role: "дополнительная", weeklyPlan: 3, mirrorPlatformIds: ["main"] },
    ];

    expect(sanitizePlatforms(platforms)).toEqual([
      { ...platforms[0], mirrorPlatformIds: ["extra"] },
      { ...platforms[1], mirrorPlatformIds: undefined },
    ]);
  });
});
