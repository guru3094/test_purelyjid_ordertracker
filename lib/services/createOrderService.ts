import { appendOrderToSheet, CreateSheetOrderInput } from "@/lib/google/sheets";

const CATEGORIES = ["Workshop", "Resin Art", "Raw Materials"] as const;

export interface CreateOrderRequest {
  customerName?: unknown;
  mobileNumber?: unknown;
  email?: unknown;
  remarks?: unknown;
  productDetails?: unknown;
  productCost?: unknown;
  advancePaid?: unknown;
  fulfillmentMethod?: unknown;
  productCategory?: unknown;
}

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }

export async function createOrder(request: CreateOrderRequest) {
  const customerName = text(request.customerName);
  const mobileNumber = text(request.mobileNumber).replace(/\D/g, "");
  const email = text(request.email);
  const remarks = text(request.remarks);
  const productDetails = text(request.productDetails);
  const fulfillmentMethod = text(request.fulfillmentMethod);
  const productCategory = text(request.productCategory);
  const productCost = Number(request.productCost);
  const advancePaid = Number(request.advancePaid);

  if (!customerName || !mobileNumber || !productDetails || !fulfillmentMethod || !productCategory) throw new Error("Please complete all required fields.");
  if (!/^[6-9]\d{9}$/.test(mobileNumber)) throw new Error("Enter a valid 10-digit Indian mobile number.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (fulfillmentMethod !== "Pickup" && fulfillmentMethod !== "Delivery") throw new Error("Invalid fulfilment method.");
  if (!CATEGORIES.includes(productCategory as (typeof CATEGORIES)[number])) throw new Error("Invalid product category.");
  if (!Number.isFinite(productCost) || productCost <= 0) throw new Error("Product cost must be greater than zero.");
  if (!Number.isFinite(advancePaid) || advancePaid < 0 || advancePaid > productCost) throw new Error("Advance paid must be between ₹0 and product cost.");

  return appendOrderToSheet({ customerName, mobileNumber, email, remarks, productDetails, productCost, advancePaid,
    fulfillmentMethod: fulfillmentMethod as CreateSheetOrderInput["fulfillmentMethod"],
    productCategory: productCategory as CreateSheetOrderInput["productCategory"] });
}
