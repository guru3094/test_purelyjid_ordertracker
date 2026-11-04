import { validateStatus } from "./statusValidator";
import { validateDate } from "./dateValidator";
import { validateCourier } from "./courierValidator";
import { Order } from "@/lib/types/order";

export function validateOrder(order: Order): void {
  if (!order.orderId.trim()) {
    throw new Error("Order ID is required.");
  }

  if (!order.customerName.trim()) {
    throw new Error("Customer Name is required.");
  }

  if (!order.mobileNumber.trim()) {
    throw new Error("Mobile Number is required.");
  }

  validateStatus(order.status);

  validateDate(order.orderDate);

  validateDate(order.lastUpdated);

  // An online request is received before a courier has been selected.
  if (!(order.orderId.startsWith('PJM') && order.status === 'ORDER_RECEIVED' && !order.courierPartner)) {
    validateCourier(order.fulfillmentMethod, order.courierPartner);
  }
}
