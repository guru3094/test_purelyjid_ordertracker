import { GoogleSheetRow } from "./types";

export function mapGoogleSheetRow(values: string[]): GoogleSheetRow {
  return {
    orderId: values[0]?.trim() ?? "",
    customerName: values[1]?.trim() ?? "",
    mobileNumber: values[2]?.trim() ?? "",
    email: values[3]?.trim() ?? "",
    orderDate: values[4]?.trim() ?? "",

    fulfillmentMethod:
      values[5]?.trim() === "Delivery" ? "Delivery" :
        values[5]?.trim() === "Pickup" ? "Pickup" : "",

    status: values[6]?.trim() ?? "",
    courierPartner: values[7]?.trim() ?? "",
    trackingNumber: values[8]?.trim() ?? "",
    expectedDeliveryDate: values[9]?.trim() ?? "",
    remarks: values[10]?.trim() ?? "",
    lastUpdated: values[11]?.trim() ?? "",
    syncStatus: values[12]?.trim() ?? "",
    syncError: values[13]?.trim() ?? "",
    productName: values[14]?.trim() ?? "",
    productCost: values[15]?.trim() ?? "",
    advancePaid: values[16]?.trim() ?? "",
    balanceToBePaid: values[17]?.trim() ?? "",
    productCategory: values[18]?.trim() ?? "",
  };
}
