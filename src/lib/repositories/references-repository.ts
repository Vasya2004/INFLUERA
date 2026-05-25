import type { CreatorReference } from "../types";
import { mapReferenceForDb } from "../data/mappers";
import { deleteRow, upsertRow } from "./db";

export async function saveReference(userId: string, reference: CreatorReference) {
  await upsertRow("creator_references", mapReferenceForDb(userId, reference), ["user_id", "id"]);
}

export async function removeReference(userId: string, referenceId: string) {
  await deleteRow("creator_references", userId, referenceId);
}
