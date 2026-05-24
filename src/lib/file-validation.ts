import type { AttachmentBucket } from "./types";

export type FileValidationRule = {
  bucket: AttachmentBucket | "platform-icons" | "profile-assets";
  maxBytes: number;
  allowedMimeTypes: string[];
};

export const FILE_RULES: Record<FileValidationRule["bucket"], FileValidationRule> = {
  "platform-icons": {
    bucket: "platform-icons",
    maxBytes: 1 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
  },
  "template-files": {
    bucket: "template-files",
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "application/pdf", "text/plain"],
  },
  "publication-files": {
    bucket: "publication-files",
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/svg+xml", "image/webp", "application/pdf", "text/plain"],
  },
  "profile-assets": {
    bucket: "profile-assets",
    maxBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
  },
};

export function validateFile(file: File, bucket: FileValidationRule["bucket"]): string | null {
  const rule = FILE_RULES[bucket];
  if (!rule.allowedMimeTypes.includes(file.type)) {
    return `Недопустимый тип файла: ${file.type || "неизвестный"}`;
  }
  if (file.size > rule.maxBytes) {
    return `Файл слишком большой. Максимум: ${formatBytes(rule.maxBytes)}`;
  }
  return null;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} МБ`;
}

