import { describe, expect, it } from "vitest";
import { createDemoAppState } from "./demo-seed";
import { summarizeLegacyWorkspace, workspaceHasMeaningfulData } from "./workspace-migration";

describe("workspace migration helpers", () => {
  it("detects meaningful legacy workspace", () => {
    const state = createDemoAppState();
    expect(workspaceHasMeaningfulData(state)).toBe(true);
    expect(workspaceHasMeaningfulData(null)).toBe(false);
    expect(workspaceHasMeaningfulData({
      ...state,
      platforms: [],
      platformMetrics: [],
      goals: [],
      ideas: [],
      publications: [],
      templates: [],
      checkpoints: [],
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
    })).toBe(false);
  });

  it("summarizes legacy workspace counts", () => {
    const state = createDemoAppState();
    expect(summarizeLegacyWorkspace(state)).toContain("4 платформ");
    expect(summarizeLegacyWorkspace(state)).toContain("6 идей");
  });
});
