import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("./supabase", () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mocks.maybeSingle,
        })),
      })),
      upsert: mocks.upsert,
    })),
  },
}));

import {
  isOnboardingCompleted,
  markOnboardingCompleted,
  readUserSettings,
  saveUserSettings,
} from "./user-settings";

describe("user settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.maybeSingle.mockResolvedValue({ data: { data: { theme: "dark" } }, error: null });
    mocks.upsert.mockResolvedValue({ error: null });
  });

  it("reads object settings data", async () => {
    await expect(readUserSettings("u1")).resolves.toEqual({ theme: "dark" });
  });

  it("returns empty settings when the table is not available", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { code: "42P01", message: "missing" } });
    await expect(readUserSettings("u1")).resolves.toEqual({});
  });

  it("merges patches into existing user settings", async () => {
    await expect(saveUserSettings("u1", { onboardingCompletedAt: "2026-05-24T00:00:00.000Z" })).resolves.toEqual({
      theme: "dark",
      onboardingCompletedAt: "2026-05-24T00:00:00.000Z",
    });
    expect(mocks.upsert).toHaveBeenCalledWith(
      {
        user_id: "u1",
        data: {
          theme: "dark",
          onboardingCompletedAt: "2026-05-24T00:00:00.000Z",
        },
      },
      { onConflict: "user_id" },
    );
  });

  it("marks onboarding completion and detects it", async () => {
    const completedAt = "2026-05-24T00:00:00.000Z";
    const result = await markOnboardingCompleted("u1", completedAt);
    expect(result.onboardingCompletedAt).toBe(completedAt);
    expect(isOnboardingCompleted(result)).toBe(true);
    expect(isOnboardingCompleted({})).toBe(false);
  });
});

