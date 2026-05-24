import { classifyApiError } from "../api-errors";
import { supabase } from "../supabase";

export function requireSupabase() {
  if (!supabase) throw classifyApiError(new Error("Supabase не настроен"));
  return supabase;
}

export async function upsertRow(
  table: string,
  row: Record<string, unknown>,
  onConflict: string[],
) {
  const client = requireSupabase();
  const { error } = await client.from(table).upsert(row, { onConflict: onConflict.join(",") });
  if (error) throw classifyApiError(error);
}

export async function upsertRows(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string[],
) {
  if (rows.length === 0) return;
  const client = requireSupabase();
  const { error } = await client.from(table).upsert(rows, { onConflict: onConflict.join(",") });
  if (error) throw classifyApiError(error);
}

export async function deleteRow(table: string, userId: string, id: string) {
  const client = requireSupabase();
  const { error } = await client.from(table).delete().eq("user_id", userId).eq("id", id);
  if (error) throw classifyApiError(error);
}

export async function deleteRowsForUser(table: string, userId: string) {
  const client = requireSupabase();
  const { error } = await client.from(table).delete().eq("user_id", userId);
  if (error) throw classifyApiError(error);
}
