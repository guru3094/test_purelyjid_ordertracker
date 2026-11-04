import { google } from "googleapis";
import { getGoogleAuth } from "./auth";
import { config } from "@/lib/config";

export async function readOrdersSheet() {
  const auth = getGoogleAuth();

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.sheetId,
    range: "Orders!A:S",
  });

  return response.data.values ?? [];
}

export interface CreateSheetOrderInput {
  customerName: string;
  mobileNumber: string;
  email?: string;
  remarks?: string;
  productDetails: string;
  productCost: number;
  advancePaid: number;
  fulfillmentMethod: "Pickup" | "Delivery";
  productCategory: "Workshop" | "Resin Art" | "Raw Materials";
}

function generateOrderId(existingRows: unknown[][]): string {
  const ids = new Set(existingRows.slice(1).map((row) => String(row[0] ?? "").trim()));
  for (let i = 0; i < 1000; i += 1) {
    const candidate = `PJ${Math.floor(100000 + Math.random() * 900000)}`;
    if (!ids.has(candidate)) return candidate;
  }
  throw new Error("Unable to generate a unique order ID.");
}

function indiaDateTime() {
  const now = new Date();

  // Match the historical Google Sheet format consumed by the existing sync:
  // ORDER_DATE   = M/D/YYYY
  // LAST_UPDATED = h:mm:ss AM/PM
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("month")}/${get("day")}/${get("year")}`,
    lastUpdated: `${get("hour")}:${get("minute")}:${get("second")} ${get("dayPeriod")}`,
  };
}

export async function appendOrderToSheet(input: CreateSheetOrderInput) {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const existingRows = await readOrdersSheet();
  const orderId = generateOrderId(existingRows);
  const { date, lastUpdated } = indiaDateTime();
  const balance = input.productCost - input.advancePaid;

  const row = [
    orderId, input.customerName, input.mobileNumber, input.email ?? "", date,
    input.fulfillmentMethod, "ORDER_RECEIVED", "", "", "", input.remarks ?? "", lastUpdated,
    "", "", input.productDetails, input.productCost, input.advancePaid, balance,
    input.productCategory,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.google.sheetId,
    range: "Orders!A:S",
    // Preserve date/time strings exactly like the historical rows; avoid Sheets auto-converting them to serial numbers.
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  return { orderId, orderDate: date, status: "ORDER_RECEIVED", balance };
}
