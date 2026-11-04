import { NextRequest, NextResponse } from "next/server";

import { syncGoogleSheet } from "@/lib/services/googleSheetSyncService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,
          error: "Cron configuration is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const authorization =
      request.headers.get("authorization");

    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const result = await syncGoogleSheet();

    return NextResponse.json(
      {
        success: true,
        result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Google Sheet cron sync failed:",
      error
    );

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
