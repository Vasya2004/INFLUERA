import { classifyApiError } from "./api-errors";
import { supabase } from "./supabase";

export async function requestAccountDeletion(reason?: string) {
  if (!supabase) throw classifyApiError(new Error("Supabase не настроен"));

  const { error } = await supabase.rpc("request_account_deletion", {
    deletion_reason: reason?.trim() || null,
  });

  if (error) throw classifyApiError(error);
}

