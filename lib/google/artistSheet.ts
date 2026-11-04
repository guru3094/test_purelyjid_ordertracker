import { google } from "googleapis";
import { getGoogleAuth } from "@/lib/google/auth";

export type ArtistSheetOrder = {
  order_id: string;
  order_date: string;
  customer_name: string;
  product_name: string;
  requirements?: string | null;
  artist_cost?: number | null;
  artist_advance?: number | null;
  artist_balance?: number | null;
  estimated_delivery_date?: string | null;
  comments?: string | null;
};

export function getMonthFromOrderDate(orderDate: string) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let month = 0;
  const mdY = orderDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const yMd = orderDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (mdY) month = Number(mdY[1]);
  else if (yMd) month = Number(yMd[2]);
  return month >= 1 && month <= 12 ? months[month - 1] : "";
}

function formatDeliveryDate(value?: string | null) {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export async function appendArtistOrder(order: ArtistSheetOrder) {
  const spreadsheetId = process.env.RESIN_ARTIST_GOOGLE_SHEET_ID;
  const sheetName = process.env.RESIN_ARTIST_GOOGLE_SHEET_TAB || "Artist";
  if (!spreadsheetId) throw new Error("RESIN_ARTIST_GOOGLE_SHEET_ID is not configured.");

  const sheets = google.sheets({ version: "v4", auth: getGoogleAuth() });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:K`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[
      getMonthFromOrderDate(order.order_date),
      order.order_date,
      order.customer_name,
      order.product_name,
      order.requirements ?? "",
      order.artist_cost ?? 0,
      order.artist_advance ?? 0,
      order.artist_balance ?? 0,
      formatDeliveryDate(order.estimated_delivery_date),
      "Pending",
      order.comments ?? "",
    ]] },
  });
}

// Existing A:K sheets do not have an order-ID column. Match the prior stored
// product/date/customer exactly and refuse ambiguous rows instead of guessing.
export async function updateArtistOrder(order: ArtistSheetOrder, previousProductName: string) {
  const spreadsheetId = process.env.RESIN_ARTIST_GOOGLE_SHEET_ID;
  const sheetName = process.env.RESIN_ARTIST_GOOGLE_SHEET_TAB || "Artist";
  if (!spreadsheetId) throw new Error("RESIN_ARTIST_GOOGLE_SHEET_ID is not configured.");
  const sheets = google.sheets({ version: "v4", auth: getGoogleAuth() });
  const quoted = `'${sheetName.replaceAll("'", "''")}'`;
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${quoted}!A:K` });
  const dateKey = (value: unknown) => {
    const s = String(value || "").trim();
    const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) return `${iso[1]}-${Number(iso[2])}-${Number(iso[3])}`;
    const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return match ? `${match[3]}-${Number(match[1])}-${Number(match[2])}` : s;
  };
  const candidates = (data.values || []).map((row, index) => ({ row, index })).filter(({ row }) => dateKey(row[1]) === dateKey(order.order_date) && String(row[2] || "").trim() === order.customer_name.trim());
  const previousMatches = candidates.filter(({ row }) => String(row[3] || "").trim() === previousProductName.trim());
  const matches = previousMatches.length ? previousMatches : candidates.filter(({ row }) => String(row[3] || "").trim() === order.product_name.trim());
  if (matches.length !== 1) throw new Error("Could not uniquely find the existing Artist Sheet row. Check the customer/date/product entry before retrying acceptance.");
  const rowNumber = matches[0].index + 1;
  // Keep the artist's existing status, costs and progress; change only the
  // artist-facing product description and artist comments entered by staff.
  await sheets.spreadsheets.values.batchUpdate({ spreadsheetId, requestBody: { valueInputOption: "RAW", data: [
    { range: `${quoted}!D${rowNumber}`, values: [[order.product_name]] },
    { range: `${quoted}!K${rowNumber}`, values: [[order.comments ?? ""]] },
  ] } });
}
