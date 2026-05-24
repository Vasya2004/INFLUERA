import type { Goal } from "../types";
import { mapGoalForDb } from "../data/mappers";
import { deleteRow, upsertRow, upsertRows } from "./db";

export async function saveGoal(userId: string, goal: Goal) {
  await upsertRow("goals", mapGoalForDb(userId, goal), ["user_id", "id"]);
}

export async function saveGoals(userId: string, goals: Goal[]) {
  if (goals.length === 0) return;
  await upsertRows("goals", goals.map(goal => mapGoalForDb(userId, goal)), ["user_id", "id"]);
}

export async function removeGoal(userId: string, goalId: string) {
  await deleteRow("goals", userId, goalId);
}
