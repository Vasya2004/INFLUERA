import type { Checkpoint } from "../types";
import { mapCheckpointForDb } from "../data/mappers";
import { deleteRow, upsertRow } from "./db";

export async function saveCheckpoint(userId: string, checkpoint: Checkpoint) {
  await upsertRow("checkpoints", mapCheckpointForDb(userId, checkpoint), ["user_id", "id"]);
}

export async function removeCheckpoint(userId: string, checkpointId: string) {
  await deleteRow("checkpoints", userId, checkpointId);
}
