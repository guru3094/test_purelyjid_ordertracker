import { NextRequest, NextResponse } from "next/server";

import { getOrderById } from "@/lib/services/orderService";
import { handleApiRequest } from "@/lib/api/handleApiRequest";
import { generateCorrelationId } from "@/lib/utils/generateCorrelationId";
import { runWithCorrelationId } from "@/lib/context/correlationContext";
import { logger } from "@/lib/logger/logger";

interface RouteContext {
  params: Promise<{
    orderId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const correlationId = generateCorrelationId();

  return runWithCorrelationId(
    correlationId,
    async () =>
      handleApiRequest(async () => {
        const { orderId } = await params;

        logger.info(
          "ordersApi",
          "Fetching order by ID",
          {
            orderId,
          }
        );

        const result = await getOrderById(orderId);

        logger.info(
          "ordersApi",
          "Order fetched successfully",
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
