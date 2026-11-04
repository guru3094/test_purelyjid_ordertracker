import { NextResponse } from "next/server";

import { syncGoogleSheet } from "@/lib/sync/syncGoogleSheet";
import { generateCorrelationId } from "@/lib/utils/generateCorrelationId";
import { runWithCorrelationId } from "@/lib/context/correlationContext";
import { handleApiRequest } from "@/lib/api/handleApiRequest";

export async function GET() {
  const correlationId = generateCorrelationId();

  return runWithCorrelationId(
    correlationId,
    () =>
      handleApiRequest(async () => {
        const result = await syncGoogleSheet();

        return NextResponse.json({
          success: true,
          correlationId,
          message: "Scheduled sync completed.",
          result,
        });
      })
  );
}
