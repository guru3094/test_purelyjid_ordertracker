import { supabase } from "./client";

export async function getActiveStatuses() {
  const { data, error } = await supabase
    .from("order_status_master")
    .select("status_code")
    .eq("is_active", true)
    .order("display_order", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (status) => status.status_code
  );
}

export async function getActiveCouriers() {
  const { data, error } = await supabase
    .from("courier_master")
    .select("courier_name")
    .eq("is_active", true)
    .order("courier_name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (courier) => courier.courier_name
  );
}

export async function getActiveFulfillmentMethods() {
  const { data, error } = await supabase
    .from("order_status_master")
    .select("fulfillment_method")
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return [
    ...new Set(
      (data ?? []).map(
        (method) => method.fulfillment_method
      )
    ),
  ];
}
