import { unstable_cache } from "next/cache";
import { readOrdersSheet } from "@/lib/google/sheets";
import { mapGoogleSheetRow } from "@/lib/google/mapper";

export const STAFF_ORDERS_CACHE_TAG = "staff-orders-google-sheet";

export const getCachedStaffOrders = unstable_cache(
  async () => {
    const rows = await readOrdersSheet();

    return rows
      .slice(1)
      .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
      .map((row) => mapGoogleSheetRow(row))
      .reverse();
  },
  ["staff-orders-google-sheet-v1"],
  {
    revalidate: 60,
    tags: [STAFF_ORDERS_CACHE_TAG],
  }
);
