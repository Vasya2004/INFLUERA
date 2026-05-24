import type { Idea } from "../types";
import { mapIdeaForDb } from "../data/mappers";
import { deleteRow, upsertRow } from "./db";

export async function saveIdea(userId: string, idea: Idea) {
  await upsertRow("ideas", mapIdeaForDb(userId, idea), ["user_id", "id"]);
}

export async function removeIdea(userId: string, ideaId: string) {
  await deleteRow("ideas", userId, ideaId);
}
