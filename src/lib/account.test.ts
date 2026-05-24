import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppApiError } from "./api-errors";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabase: {
    rpc: mocks.rpc,
  },
}));

import { requestAccountDeletion } from "./account";

describe("account helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rpc.mockResolvedValue({ error: null });
  });

  it("requests account deletion through RPC with a trimmed reason", async () => {
    await requestAccountDeletion("  не нужен аккаунт  ");

    expect(mocks.rpc).toHaveBeenCalledWith("request_account_deletion", {
      deletion_reason: "не нужен аккаунт",
    });
  });

  it("sends null reason for blank input", async () => {
    await requestAccountDeletion("   ");

    expect(mocks.rpc).toHaveBeenCalledWith("request_account_deletion", {
      deletion_reason: null,
    });
  });

  it("classifies RPC errors", async () => {
    mocks.rpc.mockResolvedValue({ error: { code: "42501", message: "permission denied" } });

    await expect(requestAccountDeletion()).rejects.toBeInstanceOf(AppApiError);
  });
});

