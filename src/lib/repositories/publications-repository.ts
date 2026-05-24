import type { Publication } from "../types";
import { classifyApiError } from "../api-errors";
import { mapPublicationForDb } from "../data/mappers";
import { deleteRow, requireSupabase, upsertRow } from "./db";
import { removeStorageObjects } from "../storage-utils";

export async function savePublication(userId: string, publication: Publication) {
  await upsertRow("publications", mapPublicationForDb(userId, publication), ["user_id", "id"]);
  await savePublicationChannel(userId, publication);
}

export async function removePublication(userId: string, publicationId: string) {
  const client = requireSupabase();
  const filesResult = await client
    .from("publication_files")
    .select("storage_path")
    .eq("user_id", userId)
    .eq("publication_id", publicationId);
  if (filesResult.error) throw classifyApiError(filesResult.error);
  const paths = ((filesResult.data ?? []) as Array<{ storage_path: string | null }>)
    .map(file => file.storage_path)
    .filter((path): path is string => Boolean(path));

  const channelDelete = await client
    .from("publication_channels")
    .delete()
    .eq("user_id", userId)
    .eq("publication_id", publicationId);
  if (channelDelete.error) throw classifyApiError(channelDelete.error);
  const filesDelete = await client
    .from("publication_files")
    .delete()
    .eq("user_id", userId)
    .eq("publication_id", publicationId);
  if (filesDelete.error) throw classifyApiError(filesDelete.error);
  await removeStorageObjects("publication-files", paths);
  await deleteRow("publications", userId, publicationId);
}

async function savePublicationChannel(userId: string, publication: Publication) {
  if (!publication.platformId) return;

  const client = requireSupabase();
  const deleteResult = await client
    .from("publication_channels")
    .delete()
    .eq("user_id", userId)
    .eq("publication_id", publication.id);
  if (deleteResult.error) throw classifyApiError(deleteResult.error);

  await upsertRow(
    "publication_channels",
    {
      user_id: userId,
      publication_id: publication.id,
      platform_id: publication.platformId,
    },
    ["user_id", "publication_id", "platform_id"],
  );
}
