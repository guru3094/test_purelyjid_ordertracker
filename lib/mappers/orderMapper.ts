import { Order } from "@/lib/types/order";

export interface DbOrder {
  order_id: string;
  customer_name: string;
  mobile_number: string;
  email: string | null;
  order_date: string;
  fulfillment_method: "Pickup" | "Delivery";
  status_id: string;
  courier_id: string | null;
  tracking_number: string | null;
  expected_delivery_date: string | null;
  remarks: string | null;
  product_name: string | null;
  product_cost: number | null;
  advance_paid: number | null;
  balance_to_be_paid: number | null;
  product_category: string | null;
  last_sheet_updated: string;
}

export function mapOrderToDb(
  order: Order,
  statusId: string,
  courierId: string | null
): DbOrder {
  return {
    order_id: order.orderId,
    customer_name: order.customerName,
    mobile_number: order.mobileNumber,
    email:
  order.email && order.email.trim() !== ""
    ? order.email
    : null,
    order_date:
  order.orderDate && order.orderDate.trim() !== ""
    ? order.orderDate
    : new Date().toISOString(),
    fulfillment_method: order.fulfillmentMethod,
    status_id: statusId,
    courier_id: courierId,
    tracking_number:
  order.trackingNumber &&
  order.trackingNumber.trim() !== ""
    ? order.trackingNumber
    : null,
    expected_delivery_date: order.expectedDeliveryDate && order.expectedDeliveryDate.trim() !== ""
    ? order.expectedDeliveryDate
    : null,
    remarks:
  order.remarks && order.remarks.trim() !== ""
    ? order.remarks
    : null,
    product_name:
  order.productName && order.productName.trim() !== ""
    ? order.productName
    : null,
    product_cost: order.productCost ?? null,
    advance_paid: order.advancePaid ?? null,
    balance_to_be_paid: order.balanceToBePaid ?? null,
    product_category: order.productCategory ?? null,
    last_sheet_updated:
  order.lastUpdated && order.lastUpdated.trim() !== ""
    ? order.lastUpdated
    : new Date().toISOString(),
  };
}

export function mapDbToOrder(db: DbOrder): Order {
  return {
    orderId: db.order_id,
    customerName: db.customer_name,
    mobileNumber: db.mobile_number,
    email: db.email ?? undefined,
    orderDate: db.order_date,
    fulfillmentMethod: db.fulfillment_method,
    status: "", // Will be populated from order_status_master later
    courierPartner: undefined, // Will be populated from courier_master later
    trackingNumber: db.tracking_number ?? undefined,
    expectedDeliveryDate: db.expected_delivery_date ?? undefined,
    remarks: db.remarks ?? undefined,
    productName: db.product_name ?? undefined,
    productCost: db.product_cost ?? undefined,
    advancePaid: db.advance_paid ?? undefined,
    balanceToBePaid: db.balance_to_be_paid ?? undefined,
    productCategory: db.product_category as Order["productCategory"] ?? undefined,
    lastUpdated: db.last_sheet_updated,
  };
}
