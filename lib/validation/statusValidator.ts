import { ORDER_STATUSES } from "../constants/orderStatuses";

export function validateStatus(status: string): void {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error(`Invalid order status: ${status}`);
  }
}
