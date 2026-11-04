import type { InvoiceSnapshot } from "./links";

function formatMoney(value: number) { return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }

export function orderStatusSentence(status: string): string {
  const key = status.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const sentences: Record<string, string> = {
    ORDER_RECEIVED: "Thank you for choosing PurelyJid! Your order has been received successfully.",
    PAYMENT_PENDING: "Your order is awaiting payment. Please contact PurelyJid if you need assistance.",
    PHOTO_PENDING: "We are waiting for the photos needed to proceed with your order.",
    PHOTO_RECEIVED: "We have received your photos and are preparing your order.",
    ORDER_CONFIRMED: "Your order has been confirmed and is being prepared.",
    PREPARING: "Your order is being prepared.",
    PROCESSING: "Your order is in progress.",
    DESIGN_APPROVAL_PENDING: "Your design is awaiting approval.",
    CUSTOMER_APPROVAL_PENDING: "Your design is awaiting your approval.",
    DESIGN_APPROVED: "Your design has been approved and work on your order is continuing.",
    DESIGN_IN_PROGRESS: "The design for your order is in progress.",
    DEHYDRATION_IN_PROGRESS: "The flowers for your order are being prepared.",
    PRODUCTION_IN_PROGRESS: "Your order is in production.",
    RESIN_CASTING_IN_PROGRESS: "Your resin artwork is being prepared.",
    FINISHING_IN_PROGRESS: "Your order is in the finishing stage.",
    QUALITY_CHECK: "Your order is undergoing a quality check.",
    PACKAGING_IN_PROGRESS: "Your order is being packaged.",
    PACKED: "Your order has been packed.",
    READY_FOR_PICKUP: "Your order is ready for pickup.",
    PICKED_UP: "Your order has been picked up. Thank you for choosing PurelyJid!",
    READY_FOR_DISPATCH: "Your order is ready for dispatch.",
    DISPATCHED: "Your order has been dispatched.",
    SHIPPED: "Your order has been shipped.",
    READY_FOR_DELIVERY: "Your order is ready for delivery.",
    OUT_FOR_DELIVERY: "Your order is out for delivery.",
    DELIVERED: "Your order has been delivered. Thank you for choosing PurelyJid!",
    COMPLETED: "Your order is complete. Thank you for choosing PurelyJid!",
    CANCELLED: "Your order has been cancelled. Please contact PurelyJid if you need assistance.",
  };
  if (sentences[key]) return sentences[key];
  if (/^[A-Z][A-Z0-9_]{0,59}$/.test(key)) {
    const label = key.toLowerCase().replaceAll("_", " ");
    return `Your order status is now ${label}.`;
  }
  return "Here is an update on your PurelyJid order.";
}

export function customerWhatsAppMessage(snapshot: InvoiceSnapshot, invoiceUrl: string, productCategory: string | undefined, orderStatus: string, remarks?: string): string {
  const omitTracking = ["workshop", "raw materials"].includes(productCategory?.trim().toLowerCase() ?? "");
  return [
    `Hi ${snapshot.customerName},`, "",
    orderStatusSentence(orderStatus), "",
    `Order ID: ${snapshot.orderId}`,
    ...(snapshot.mode === "invoice" ? [
      `Order: ${snapshot.productName}`,
      `Order Amount: ${formatMoney(snapshot.productCost!)}`,
      `Advance Paid: ${formatMoney(snapshot.advancePaid)}`,
      `Balance: ${formatMoney(snapshot.balance!)}`,
      `Fulfilment: ${snapshot.fulfillmentMethod}`,
    ] : [
      `Advance Paid: ${formatMoney(snapshot.advancePaid)}`,
      "Product selection: Pending",
    ]),
    ...(remarks?.trim() ? [`Remarks: ${remarks.trim()}`] : []),
    "", `${snapshot.mode === "invoice" ? "Invoice" : "Advance receipt"} PDF: ${invoiceUrl}`, "",
    ...(!omitTracking ? [`Track your order using Order ID ${snapshot.orderId} at purelyjid.in/track-order`, ""] : []),
    "– PurelyJid",
  ].join("\n");
}
