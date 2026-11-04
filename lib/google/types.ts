import { ProductCategory } from "@/lib/types/order";

export interface GoogleSheetRow {
  orderId: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  orderDate: string;
  fulfillmentMethod: "Pickup" | "Delivery" | "";
  status: string;
  courierPartner?: string;
  trackingNumber?: string;
  expectedDeliveryDate?: string;
  remarks?: string;
  lastUpdated: string;
  syncStatus?: string;
  syncError?: string;
  productName?: string;
  productCost?: string;
  advancePaid?: string;
  balanceToBePaid?: string;
  productCategory?: ProductCategory | string;
}
