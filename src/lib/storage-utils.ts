import { classifyApiError } from "./api-errors";
import { supabase } from "./supabase";

export async function createSignedStorageUrl(bucket: string, path: string | null | undefined) {
  if (!supabase || !path) return undefined;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return undefined;
  return data.signedUrl;
}

export async function uploadDataUrlToStorage(
  bucket: string,
  path: string,
  dataUrl: string,
): Promise<string> {
  if (!supabase) throw classifyApiError(new Error("Supabase не настроен"));
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: "3600",
    contentType: blob.type,
    upsert: true,
  });
  if (error) throw classifyApiError(error);
  return path;
}

export async function removeStorageObjects(bucket: string, paths: string[]) {
  if (!supabase || paths.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw classifyApiError(error);
}

export function mimeExtension(mimeType: string | undefined) {
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/png") return "png";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "text/plain") return "txt";
  return "jpg";
}

export function sanitizeStorageFilename(name: string) {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
  return cleaned || "file";
}

