import { describe, expect, it } from "vitest";
import { FILE_RULES, formatBytes, validateFile } from "./file-validation";

function makeFile(type: string, size: number): File {
  return new File([new Uint8Array(size)], "test-file", { type });
}

describe("file validation", () => {
  it("accepts allowed publication files within the bucket limit", () => {
    const file = makeFile("application/pdf", 1024);
    expect(validateFile(file, "publication-files")).toBeNull();
  });

  it("rejects disallowed mime types", () => {
    const file = makeFile("application/x-msdownload", 1024);
    expect(validateFile(file, "template-files")).toContain("Недопустимый тип файла");
  });

  it("rejects files larger than the bucket limit", () => {
    const file = makeFile("image/png", FILE_RULES["platform-icons"].maxBytes + 1);
    expect(validateFile(file, "platform-icons")).toBe("Файл слишком большой. Максимум: 1 МБ");
  });

  it("formats byte sizes for validation messages", () => {
    expect(formatBytes(512 * 1024)).toBe("512 КБ");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 МБ");
  });
});

