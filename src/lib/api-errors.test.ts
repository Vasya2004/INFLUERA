import { describe, expect, it } from "vitest";
import { AppApiError, classifyApiError } from "./api-errors";

describe("classifyApiError", () => {
  it("classifies auth errors", () => {
    const error = classifyApiError({ code: "PGRST301", message: "JWT expired" });
    expect(error).toBeInstanceOf(AppApiError);
    expect(error.kind).toBe("auth");
  });

  it("classifies rls errors", () => {
    const error = classifyApiError({ code: "42501", message: "permission denied" });
    expect(error.kind).toBe("rls");
  });

  it("classifies validation errors", () => {
    const error = classifyApiError({ code: "23505", message: "duplicate key" });
    expect(error.kind).toBe("validation");
  });
});
