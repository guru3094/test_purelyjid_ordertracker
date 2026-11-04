import { supabase } from "./client";

export async function getLastCheckpoint() {
  const { data, error } = await supabase
    .from("sync_checkpoint")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function updateCheckpoint(lastUpdated: string) {
  const { error } = await supabase
    .from("sync_checkpoint")
    .upsert({
      id: 1,
      last_sheet_updated: lastUpdated,
    });

  if (error) throw error;
}
