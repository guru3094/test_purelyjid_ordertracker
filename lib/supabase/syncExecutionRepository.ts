import { supabase } from "@/lib/supabase/client";

export interface SyncExecution {
  id?: string;
  execution_start: string;
  execution_end?: string;
  status: string;
  rows_read: number;
  rows_inserted: number;
  rows_updated: number;
  rows_failed: number;
  error_message?: string | null;
}

export async function createSyncExecution(
  execution: SyncExecution
) {
  const { data, error } = await supabase
    .from("sync_execution")
    .insert(execution)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateSyncExecution(
  id: string,
  execution: Partial<SyncExecution>
) {
  const { error } = await supabase
    .from("sync_execution")
    .update(execution)
    .eq("id", id);

  if (error) {
    throw error;
  }
}
