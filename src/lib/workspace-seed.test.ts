import { describe, expect, it } from "vitest";
import { shouldAutoApplyDemoSeed } from "./workspace-seed";

describe("shouldAutoApplyDemoSeed", () => {
  it("seeds only for a truly empty new account", () => {
    expect(shouldAutoApplyDemoSeed({
      hasNormalized: false,
      hasLegacy: false,
      demoSeedApplied: false,
      hasLocalData: false,
    })).toBe(true);

    expect(shouldAutoApplyDemoSeed({
      hasNormalized: true,
      hasLegacy: false,
      demoSeedApplied: false,
      hasLocalData: false,
    })).toBe(false);

    expect(shouldAutoApplyDemoSeed({
      hasNormalized: false,
      hasLegacy: true,
      demoSeedApplied: false,
      hasLocalData: false,
    })).toBe(false);

    expect(shouldAutoApplyDemoSeed({
      hasNormalized: false,
      hasLegacy: false,
      demoSeedApplied: true,
      hasLocalData: false,
    })).toBe(false);
  });
});
