import {
  NextRequest,
  NextResponse,
} from "next/server";

import { handleApiRequest } from "@/lib/api/handleApiRequest";
import { runWithCorrelationId } from "@/lib/context/correlationContext";
import { generateCorrelationId } from "@/lib/utils/generateCorrelationId";
import { logger } from "@/lib/logger/logger";
import { trackCustomerOrder } from "@/lib/services/orderTrackingService";

export async function GET(
  request: NextRequest
) {
  const correlationId =
    generateCorrelationId();

  return runWithCorrelationId(
    correlationId,
    () =>
      handleApiRequest(async () => {
        const searchParams =
          request.nextUrl.searchParams;

        const orderId =
          searchParams.get("orderId") ?? "";

        const mobileNumber =
          searchParams.get("mobileNumber") ??
          "";

        logger.info(
          "trackOrderApi",
          "Customer order tracking requested",
          {
            orderId,
          }
        );

        const result =
          await trackCustomerOrder(
            orderId,
            mobileNumber
          );

        logger.info(
          "trackOrderApi",
          "Customer order tracking completed",
          {
            orderId,
          }
        );

        return NextResponse.json({
          correlationId,
          ...result,
        });
      })
  );
}
