import { NextResponse } from "next/server";
import { readOrdersSheet } from "@/lib/google/sheets";

export async function GET() {
  try {
    const rows = await readOrdersSheet();

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
