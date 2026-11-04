import { createHash } from "node:crypto";
import { google } from "googleapis";
import { config } from "@/lib/config";
import { getGoogleAuth } from "@/lib/google/auth";
import { isDeliveryOnlyStatus } from "@/lib/tracking/statusStages";
import { ORDER_STATUSES } from "@/lib/constants/orderStatuses";

export const ORDER_FIELDS = [
  "orderId", "customerName", "mobileNumber", "email", "orderDate",
  "fulfillmentMethod", "status", "courierPartner", "trackingNumber",
  "expectedDeliveryDate", "remarks", "lastUpdated", "syncStatus",
  "syncError", "productName", "productCost", "advancePaid",
  "balanceToBePaid", "productCategory",
] as const;

export type OrderField = (typeof ORDER_FIELDS)[number];
export type EditableOrder = Record<OrderField, string>;
export type FieldOptions = Partial<Record<OrderField, string[]>>;

const FALLBACK_OPTIONS: FieldOptions = {
  fulfillmentMethod: ["Pickup", "Delivery"],
  status: ORDER_STATUSES,
  courierPartner: ["DTDC", "Blue Dart", "Delhivery", "India Post", "XpressBees", "Ekart"],
  productCategory: ["Workshop", "Resin Art", "Raw Materials"],
};

function sheetsApi() {
  return google.sheets({ version: "v4", auth: getGoogleAuth() });
}

async function readEditRows(): Promise<string[][]> {
  const response = await sheetsApi().spreadsheets.values.get({
    spreadsheetId: config.google.sheetId,
    range: "Orders!A:S",
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });
  return (response.data.values ?? []).map((line) => line.map((value) => String(value ?? "")));
}

function rowValues(values: string[]): string[] {
  return ORDER_FIELDS.map((_, index) => String(values[index] ?? ""));
}

function rowVersion(values: string[]): string {
  return createHash("sha256").update(JSON.stringify(rowValues(values))).digest("hex");
}

function locate(rows: string[][], orderId: string) {
  const matches = rows.flatMap((values, index) => index && String(values[0] ?? "").trim() === orderId
    ? [{ values, rowNumber: index + 1 }] : []);
  if (matches.length !== 1) throw new Error(matches.length ? "Duplicate Order IDs exist in the Google Sheet." : "Order not found in the Google Sheet.");
  return matches[0];
}

function toOrder(values: string[]): EditableOrder {
  return Object.fromEntries(ORDER_FIELDS.map((field, index) => [field, String(values[index] ?? "")])) as EditableOrder;
}

function timeInIndia(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  }).format(new Date());
}

// The form follows any actual per-cell dropdown validation in the Orders sheet.
async function readFieldOptions(rowNumber: number): Promise<FieldOptions> {
  const options: FieldOptions = { ...FALLBACK_OPTIONS };
  try {
    const api = sheetsApi();
    const metadata = await api.spreadsheets.get({
      spreadsheetId: config.google.sheetId,
      ranges: [`Orders!A${rowNumber}:S${rowNumber}`],
      includeGridData: true,
      fields: "sheets(data(rowData(values(dataValidation))))",
    });
    const cells = metadata.data.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values ?? [];
    for (let index = 0; index < ORDER_FIELDS.length; index++) {
      const condition = cells[index]?.dataValidation?.condition;
      if (!condition) continue;
      let choices: string[] = [];
      if (condition.type === "ONE_OF_LIST") {
        choices = (condition.values ?? []).map((value) => value.userEnteredValue ?? "");
      } else if (condition.type === "ONE_OF_RANGE") {
        const range = condition.values?.[0]?.userEnteredValue?.replace(/^=/, "");
        if (range) {
          try {
            const data = await api.spreadsheets.values.get({ spreadsheetId: config.google.sheetId, range });
            choices = (data.data.values ?? []).flatMap((line) => line.map(String));
          } catch { /* Retain the project's dropdown values if the source range cannot be read. */ }
        }
      }
      choices = [...new Set(choices.map((choice) => choice.trim()).filter(Boolean))];
      if (choices.length) options[ORDER_FIELDS[index]] = choices;
    }
  } catch (error) {
    console.warn("Orders Sheet dropdown metadata unavailable:", error);
  }
  return options;
}

export async function getOrderForEdit(orderId: string) {
  const rows = await readEditRows();
  const { values, rowNumber } = locate(rows, orderId);
  return { order: toOrder(values), version: rowVersion(values), options: await readFieldOptions(rowNumber) };
}

function optionalAmount(value: string, label: string): number | "" {
  if (!value) return "";
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`${label} must be a non-negative number or blank.`);
  return amount;
}

function optionalDate(value: string, label: string): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = match ? new Date(`${value}T00:00:00Z`) : new Date(value);
  if (Number.isNaN(date.getTime()) || (match && date.toISOString().slice(0, 10) !== value)) {
    throw new Error(`${label} must be a valid date or blank.`);
  }
  return match ? `${Number(match[2])}/${Number(match[3])}/${match[1]}` : value;
}

export async function updateSheetOrder(originalOrderId: string, version: string, order: EditableOrder) {
  if (!/^[a-f0-9]{64}$/.test(version)) throw new Error("Reload the order before saving.");
  if (order.orderId !== originalOrderId) throw new Error("Order ID cannot be changed because it identifies the row and related requests.");
  const rows = await readEditRows();
  const { values, rowNumber } = locate(rows, originalOrderId);
  if (rowVersion(values) !== version) throw new Error("This order changed in Google Sheets. Reload it before saving your edits.");

  const saved: EditableOrder = {
    ...order,
    orderDate: optionalDate(order.orderDate, "Order date"),
    expectedDeliveryDate: optionalDate(order.expectedDeliveryDate, "Expected delivery date"),
    lastUpdated: timeInIndia(),
  };
  if (saved.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(saved.email)) throw new Error("Enter a valid email address or leave it blank.");
  if (saved.fulfillmentMethod && !["Pickup", "Delivery"].includes(saved.fulfillmentMethod)) throw new Error("Select a valid fulfillment method or leave it blank.");
  if (saved.fulfillmentMethod === "Pickup" && isDeliveryOnlyStatus(saved.status)) throw new Error("Select a valid Pickup status or leave it blank. Delivery-only statuses cannot be used for Pickup orders.");
  if (saved.productCategory && !FALLBACK_OPTIONS.productCategory?.includes(saved.productCategory)) throw new Error("Select a valid product category or leave it blank.");

  const amountColumns: OrderField[] = ["productCost", "advancePaid", "balanceToBePaid"];
  const amounts = amountColumns.map((field) => optionalAmount(saved[field], field));
  const row = ORDER_FIELDS.map((field) => {
    const amountIndex = amountColumns.indexOf(field);
    return amountIndex >= 0 ? amounts[amountIndex] : saved[field];
  });

  // RAW preserves free text literally instead of evaluating customer-entered formulas.
  await sheetsApi().spreadsheets.values.update({
    spreadsheetId: config.google.sheetId,
    range: `Orders!A${rowNumber}:S${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });
  // Return the values as Sheets will hand them to the editor on its next load.
  const updated = locate(await readEditRows(), originalOrderId);
  return { order: toOrder(updated.values), version: rowVersion(updated.values) };
}
