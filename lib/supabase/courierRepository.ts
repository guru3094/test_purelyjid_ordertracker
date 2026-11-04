import { supabase } from "./client";

export interface Courier {
  id: string;
  courier_name: string;
}

export async function getCourierByName(
  courierName: string
): Promise<Courier | null> {
  const { data, error } = await supabase
    .from("courier_master")
    .select("id, courier_name")
    .eq("courier_name", courierName)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}
