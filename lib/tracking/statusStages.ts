/** Operational status to customer-facing progress stage (zero-based). */
export const STATUS_TO_STAGE_INDEX: Record<string, number> = {
  ORDER_RECEIVED: 0,
  PAYMENT_PENDING: 0,
  PHOTO_PENDING: 0,

  PREPARING: 1,
  ORDER_CONFIRMED: 1,
  PHOTO_RECEIVED: 1,
  DESIGN_APPROVAL_PENDING: 1,
  CUSTOMER_APPROVAL_PENDING: 1,
  DESIGN_APPROVED: 1,

  PROCESSING: 2,
  PACKED: 2,
  READY_FOR_PICKUP: 2,
  DESIGN_IN_PROGRESS: 2,
  DEHYDRATION_IN_PROGRESS: 2,
  PRODUCTION_IN_PROGRESS: 2,
  RESIN_CASTING_IN_PROGRESS: 2,
  FINISHING_IN_PROGRESS: 2,
  QUALITY_CHECK: 2,
  PACKAGING_IN_PROGRESS: 2,

  SHIPPED: 3,
  READY_FOR_DISPATCH: 3,
  DISPATCHED: 3,

  OUT_FOR_DELIVERY: 4,
  READY_FOR_DELIVERY: 4,

  DELIVERED: 5,
  PICKED_UP: 5,
  COMPLETED: 5,
};

export function normalizeStatus(status: string | null): string {
  return status?.trim().toUpperCase().replaceAll(" ", "_").replaceAll("-", "_") ?? "";
}

export function isDeliveryOnlyStatus(status: string | null): boolean {
  const stage = STATUS_TO_STAGE_INDEX[normalizeStatus(status)];
  return stage === 3 || stage === 4;
}
