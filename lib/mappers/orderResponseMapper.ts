export interface OrderResponse {
  orderId: string;
  customerName: string;
  mobileNumber: string | null;
  email: string | null;
  orderDate: string | null;
  fulfillmentMethod: string;
  status: string | null;
  courier: string | null;
  trackingNumber: string | null;
  expectedDeliveryDate: string | null;
  remarks: string | null;
  productName: string | null;
  productCost: number | null;
  advancePaid: number | null;
  balanceToBePaid: number | null;
  productCategory: string | null;
  createdAt: string;
  updatedAt: string;
}

export function mapOrderResponse(order: any): OrderResponse {
  return {
    orderId: order.order_id,
    customerName: order.customer_name,
    mobileNumber: order.mobile_number,
    email: order.email,
    orderDate: order.order_date,
    fulfillmentMethod: order.fulfillment_method,
    status: order.order_status_master?.status_code ?? null,
    courier: order.courier_master?.courier_name ?? null,
    trackingNumber: order.tracking_number,
    expectedDeliveryDate: order.expected_delivery_date,
    remarks: order.remarks,
    productName: order.product_name,
    productCost: order.product_cost,
    advancePaid: order.advance_paid,
    balanceToBePaid: order.balance_to_be_paid,
    productCategory: order.product_category,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
}
