import { supabase } from "@/lib/supabase/client";

export async function checkDatabaseHealth() {
  try {
    const { error } = await supabase
      .from("orders")
      .select("order_id")
      .limit(1);

    if (error) {
      return "DOWN";
    }

    return "UP";
  } catch {
    return "DOWN";
  }
}
