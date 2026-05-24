import type { Template } from "../types";
import { mapTemplateForDb } from "../data/mappers";
import { classifyApiError } from "../api-errors";
import { removeStorageObjects } from "../storage-utils";
import { deleteRow, requireSupabase, upsertRow } from "./db";

export async function saveTemplate(userId: string, template: Template) {
  const client = requireSupabase();
  const existingResult = await client
    .from("template_files")
    .select("id, storage_path")
    .eq("user_id", userId)
    .eq("template_id", template.id);
  if (existingResult.error) throw classifyApiError(existingResult.error);

  await upsertRow("templates", mapTemplateForDb(userId, template), ["user_id", "id"]);
  const files = template.files ?? [];
  for (const file of files) {
    if (!file.storagePath && !file.url) continue;
    const result = await client
      .from("template_files")
      .upsert({
        id: file.id,
        user_id: userId,
        template_id: template.id,
        original_name: file.name,
        storage_path: file.storagePath ?? file.url,
        mime_type: file.mimeType ?? null,
        size_bytes: file.sizeBytes ?? null,
      }, { onConflict: "user_id,id" });
    if (result.error) throw classifyApiError(result.error);
  }

  const keptIds = new Set(files.map(file => file.id));
  const stale = ((existingResult.data ?? []) as Array<{ id: string; storage_path: string | null }>)
    .filter(file => !keptIds.has(file.id));
  if (stale.length) {
    const deleteResult = await client
      .from("template_files")
      .delete()
      .eq("user_id", userId)
      .in("id", stale.map(file => file.id));
    if (deleteResult.error) throw classifyApiError(deleteResult.error);
    await removeStorageObjects(
      "template-files",
      stale.map(file => file.storage_path).filter((path): path is string => Boolean(path)),
    );
  }
}

export async function removeTemplate(userId: string, templateId: string) {
  await deleteRow("templates", userId, templateId);
}
