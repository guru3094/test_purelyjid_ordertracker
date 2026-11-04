import { NextResponse } from "next/server";

import { syncGoogleSheet } from "@/lib/services/googleSheetSyncService";

export async function GET() {

  try {

    const result = await syncGoogleSheet();

    return NextResponse.json(result);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Error",
      },
      {
        status: 500,
      }
    );

  }

}
