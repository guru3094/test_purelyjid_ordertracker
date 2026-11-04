import { supabase } from "./client";

export async function writeAuditLog(
  action: string,
  details: string
) {
  const { error } = await supabase
    .from("sync_audit")
    .insert({
      action,
      details,
      created_at: new Date().toISOString(),
    });

  if (error) throw error;
}
