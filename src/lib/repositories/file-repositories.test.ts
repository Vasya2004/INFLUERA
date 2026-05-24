import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Template } from "../types";

type QueryCall = {
  table: string;
  operation: "select" | "delete" | "upsert" | null;
  filters: Array<{ type: "eq" | "in"; column: string; value: unknown }>;
};

const mocks = vi.hoisted(() => {
  const calls = {
    queries: [] as QueryCall[],
    upserts: [] as Array<{ table: string; row: unknown; options: unknown }>,
    storageRemoves: [] as Array<{ bucket: string; paths: string[] }>,
    selectResults: {} as Record<string, { data: unknown[] | null; error: unknown | null }>,
  };

  function resultFor(call: QueryCall) {
    if (call.operation === "select") {
      return calls.selectResults[call.table] ?? { data: [], error: null };
    }
    return { error: null };
  }

  function createQuery(table: string) {
    const call: QueryCall = { table, operation: null, filters: [] };
    calls.queries.push(call);
    const chain = {
      select: vi.fn(() => {
        call.operation = "select";
        return chain;
      }),
      delete: vi.fn(() => {
        call.operation = "delete";
        return chain;
      }),
      upsert: vi.fn(async (row: unknown, options: unknown) => {
        call.operation = "upsert";
        calls.upserts.push({ table, row, options });
        return { error: null };
      }),
      eq: vi.fn((column: string, value: unknown) => {
        call.filters.push({ type: "eq", column, value });
        return chain;
      }),
      in: vi.fn((column: string, value: unknown) => {
        call.filters.push({ type: "in", column, value });
        return chain;
      }),
      then: (resolve: (value: unknown) => void) => resolve(resultFor(call)),
    };
    return chain;
  }

  return {
    calls,
    from: vi.fn(createQuery),
    storageFrom: vi.fn((bucket: string) => ({
      remove: vi.fn(async (paths: string[]) => {
        calls.storageRemoves.push({ bucket, paths });
        return { error: null };
      }),
      upload: vi.fn(async () => ({ error: null })),
      createSignedUrl: vi.fn(async () => ({ data: { signedUrl: "signed-url" }, error: null })),
    })),
  };
});

vi.mock("../supabase", () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    from: mocks.from,
    storage: {
      from: mocks.storageFrom,
    },
  },
}));

import { removePublication } from "./publications-repository";
import { saveTemplate } from "./templates-repository";

describe("file repositories with mocked Supabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.calls.queries.length = 0;
    mocks.calls.upserts.length = 0;
    mocks.calls.storageRemoves.length = 0;
    mocks.calls.selectResults = {};
  });

  it("removes publication file rows and storage objects when a publication is deleted", async () => {
    mocks.calls.selectResults.publication_files = {
      data: [{ storage_path: "u1/pub1/file-a.pdf" }, { storage_path: "u1/pub1/file-b.png" }],
      error: null,
    };

    await removePublication("u1", "pub1");

    expect(mocks.calls.queries.some(call => call.table === "publication_channels" && call.operation === "delete")).toBe(true);
    expect(mocks.calls.queries.some(call => call.table === "publications" && call.operation === "delete")).toBe(true);
    expect(mocks.calls.storageRemoves).toEqual([
      { bucket: "publication-files", paths: ["u1/pub1/file-a.pdf", "u1/pub1/file-b.png"] },
    ]);
  });

  it("removes orphaned template files when a template is saved without an existing file", async () => {
    mocks.calls.selectResults.template_files = {
      data: [
        { id: "keep", storage_path: "u1/t1/keep.pdf" },
        { id: "remove", storage_path: "u1/t1/remove.pdf" },
      ],
      error: null,
    };

    const template: Template = {
      id: "t1",
      name: "Template",
      category: "структура публикации",
      format: ["пост"],
      description: "",
      usage: "",
      content: "Body",
      files: [{
        id: "keep",
        name: "keep.pdf",
        storagePath: "u1/t1/keep.pdf",
        mimeType: "application/pdf",
        sizeBytes: 123,
        bucket: "template-files",
      }],
    };

    await saveTemplate("u1", template);

    expect(mocks.calls.upserts.some(call => call.table === "templates")).toBe(true);
    expect(mocks.calls.upserts.some(call => call.table === "template_files")).toBe(true);
    expect(mocks.calls.queries.some(call =>
      call.table === "template_files"
      && call.operation === "delete"
      && call.filters.some(filter => filter.type === "in" && filter.column === "id" && Array.isArray(filter.value) && filter.value.includes("remove")),
    )).toBe(true);
    expect(mocks.calls.storageRemoves).toEqual([
      { bucket: "template-files", paths: ["u1/t1/remove.pdf"] },
    ]);
  });
});

