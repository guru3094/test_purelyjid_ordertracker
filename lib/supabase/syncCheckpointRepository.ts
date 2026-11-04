import { supabase } from "@/lib/supabase/client";

export interface SyncCheckpoint {
  id: string;
  checkpoint_name: string;
  last_successful_sync: string | null;
  created_at: string;
  updated_at: string;
}

export async function getSyncCheckpoint(
  checkpointName: string
): Promise<SyncCheckpoint | null> {
  const { data, error } = await supabase
    .from("sync_checkpoint")
    .select("*")
    .eq("checkpoint_name", checkpointName)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getLastSuccessfulSync(
  checkpointName: string
): Promise<Date | null> {
  const checkpoint = await getSyncCheckpoint(checkpointName);

  if (!checkpoint?.last_successful_sync) {
    return null;
  }

  return new Date(checkpoint.last_successful_sync);
}

export async function updateSyncCheckpoint(
  checkpointName: string,
  timestamp: string
): Promise<void> {
  const { error } = await supabase
    .from("sync_checkpoint")
    .update({
      last_successful_sync: timestamp,
      updated_at: new Date().toISOString(),
    })
    .eq("checkpoint_name", checkpointName);

  if (error) {
    throw error;
  }
}
