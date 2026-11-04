import { Order } from "@/lib/types/order";
import { FailedOrder } from "@/lib/supabase/failedOrdersRepository";

export function mapFailedOrderToOrder(
  failedOrder: FailedOrder
): Order {
  return failedOrder.payload as Order;
}
