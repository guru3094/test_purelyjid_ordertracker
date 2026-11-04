import { supabase } from "./client";
import { Order } from "@/lib/types/order";

export interface FailedOrder {
  id: string;
  order_id: string;
  failure_source: string;
  payload: Order;
  error_message: string;
  retry_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function saveFailedOrder(
  order: Order,
  errorMessage: string,
  failureSource: string
): Promise<void> {
  const { error } = await supabase
    .from("failed_orders")
    .insert({
      order_id: order.orderId,
      failure_source: failureSource,
      payload: order,
      error_message: errorMessage,
      retry_count: 0,
      status: "PENDING",
    });

  if (error) {
    throw error;
  }
}

export async function getPendingFailedOrders(): Promise<FailedOrder[]> {
  const { data, error } = await supabase
    .from("failed_orders")
    .select("*")
    .eq("status", "PENDING");

  if (error) {
    throw error;
  }

  return (data ?? []) as FailedOrder[];
}

export async function resolveFailedOrder(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("failed_orders")
    .update({
      status: "RESOLVED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function incrementRetryCount(
  id: string,
  retryCount: number
): Promise<void> {
  const { error } = await supabase
    .from("failed_orders")
    .update({
      retry_count: retryCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}
export async function abandonFailedOrder(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("failed_orders")
    .update({
      status: "ABANDONED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}
