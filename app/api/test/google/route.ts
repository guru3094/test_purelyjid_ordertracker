import { NextResponse } from "next/server";

import { readOrdersSheet } from "@/lib/google/sheets";
import { mapGoogleSheetRow } from "@/lib/google/mapper";

export async function GET() {
  try {
    // Read all rows from Google Sheets
    const rows = await readOrdersSheet();

    // If sheet is empty
    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        totalRows: 0,
        data: [],
      });
    }

    // Skip the header row and map the remaining rows
    const mappedRows = rows
      .slice(1)
      .map((row) => mapGoogleSheetRow(row));

    return NextResponse.json({
      success: true,
      totalRows: mappedRows.length,
      data: mappedRows,
    });
  } catch (error) {
    console.error("Google Sheets Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
