import { supabase } from "./client";

export interface OrderStatus {
  id: string;
  status_code: string;
  status_name: string;
  fulfillment_method: string;
  display_order: number;
  is_active: boolean;
}

export async function getStatusByCode(statusCode: string) {
  const { data, error } = await supabase
    .from("order_status_master")
    .select("*")
    .eq("status_code", statusCode)
    .eq("is_active", true)
    .single();

  if (error) {
    throw error;
  }

  return data as OrderStatus;
}
