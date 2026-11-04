import { google } from "googleapis";
import { getGoogleAuth } from "./auth";
import { config } from "@/lib/config";
import { readOrdersSheet } from "./sheets";
export type StoreImport = {
  orderRef: string;
  name: string;
  phone: string;
  email: string;
  fulfilment: "Pickup" | "Delivery";
  address: string;
  notes: string;
  subtotal: number;
  createdAt: string;
  items: { name: string; quantity: number; unitPrice: number }[];
};
export function validateStoreImport(b: StoreImport) {
  if (
    !b ||
    !/^PJM\d{6,15}$/.test(b.orderRef) ||
    typeof b.name !== "string" ||
    !b.name.trim() ||
    b.name.length > 100 ||
    !/^\d{10,15}$/.test(b.phone) ||
    !["Pickup", "Delivery"].includes(b.fulfilment) ||
    !Number.isFinite(b.subtotal) ||
    b.subtotal < 0 ||
    !Number.isFinite(Date.parse(b.createdAt)) ||
    typeof b.email !== "string" ||
    b.email.length > 254 ||
    typeof b.address !== "string" ||
    b.address.length > 500 ||
    typeof b.notes !== "string" ||
    b.notes.length > 500 ||
    !Array.isArray(b.items) ||
    !b.items.length ||
    b.items.length > 50 ||
    b.items.some(
      (i) =>
        typeof i.name !== "string" ||
        i.name.length > 180 ||
        !Number.isInteger(i.quantity) ||
        i.quantity < 1 ||
        i.quantity > 99 ||
        !Number.isFinite(i.unitPrice) ||
        i.unitPrice < 0,
    )
  )
    throw Error("Invalid store order");
  return b;
}
export async function importedRowExists(b: StoreImport) {
  const rows = await readOrdersSheet();
  const matches = rows.slice(1).filter((r) => r[0] === b.orderRef);
  if (matches.length > 1) throw Error("Duplicate order references in sheet");
  if (matches.length && String(matches[0][2]).replace(/\D/g, "") !== b.phone)
    throw Error("Order reference collision");
  return matches.length === 1;
}
export async function appendImportedStoreOrder(b: StoreImport) {
  const d = new Date(b.createdAt);
  const date = d.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" });
  const updated = d.toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: true,
  });
  const row = [
    b.orderRef,
    b.name,
    b.phone,
    b.email,
    date,
    b.fulfilment,
    "ORDER_RECEIVED",
    "",
    "",
    "",
    [b.address, b.notes, "Source: pjresin.in"].filter(Boolean).join(" | "),
    updated,
    "",
    "",
    b.items
      .map((i) => `${i.name} × ${i.quantity} @ ₹${i.unitPrice}`)
      .join("; "),
    b.subtotal,
    0,
    b.subtotal,
    "Raw Materials",
  ];
  const sheets = google.sheets({ version: "v4", auth: getGoogleAuth() });
  await sheets.spreadsheets.values.append(
    {
      spreadsheetId: config.google.sheetId,
      range: "Orders!A:S",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    },
    { timeout: 15000, retry: false },
  );
}
