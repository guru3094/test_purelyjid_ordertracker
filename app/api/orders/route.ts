import { after, NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { getOrders } from "@/lib/services/orderService";
import { handleApiRequest } from "@/lib/api/handleApiRequest";
import { generateCorrelationId } from "@/lib/utils/generateCorrelationId";
import { runWithCorrelationId } from "@/lib/context/correlationContext";
import { logger } from "@/lib/logger/logger";
import { OrderSearchRequest } from "@/lib/models/OrderSearchRequest";
import { createOrder } from "@/lib/services/createOrderService";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import { syncGoogleSheet } from "@/lib/services/googleSheetSyncService";
import { STAFF_ORDERS_CACHE_TAG } from "@/lib/services/staffOrdersCacheService";

export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();

  return runWithCorrelationId(
    correlationId,
    () =>
      handleApiRequest(async () => {
        const searchParams = request.nextUrl.searchParams;

        const orderSearchRequest: Partial<OrderSearchRequest> = {
          page: Number(searchParams.get("page") ?? "1"),
          pageSize: Number(searchParams.get("pageSize") ?? "10"),
          q: searchParams.get("q") ?? undefined,
          status: searchParams.get("status") ?? undefined,
          fulfillmentMethod:
            searchParams.get("fulfillmentMethod") ?? undefined,
          courier: searchParams.get("courier") ?? undefined,
          sortBy: searchParams.get("sortBy") ?? undefined,
          sortOrder:
            (searchParams.get("sortOrder") as "asc" | "desc") ??
            undefined,
        };

        logger.info(
          "ordersApi",
          "Fetching orders",
          {
            request: orderSearchRequest,
          }
        );

        const result = await getOrders(orderSearchRequest);

        logger.info(
          "ordersApi",
          "Orders fetched successfully",
          {
            page: result.page,
            pageSize: result.pageSize,
            totalRecords: result.totalRecords,
            totalPages: result.totalPages,
            returnedRecords: result.orders.length,
          }
        );

        return NextResponse.json({
          correlationId,
          ...result,
        });
      })
  );
}


export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  return runWithCorrelationId(correlationId, () => handleApiRequest(async () => {
    if (!(await isStaffAuthenticated())) {
      return NextResponse.json({ correlationId, error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    logger.info("ordersApi", "Creating order in Google Sheet");
    const result = await createOrder(body);

    // The Google Sheet changed, so expire the staff Orders cache immediately.
    // The next Orders request will read fresh data and cache it again for 60 seconds.
    revalidateTag(STAFF_ORDERS_CACHE_TAG, { expire: 0 });

    after(async () => {
      try {
        const syncResult = await syncGoogleSheet();
        logger.info("ordersApi", "Post-create Google Sheet sync completed", { orderId: result.orderId, syncResult });
      } catch (error) {
        logger.error("ordersApi", "Post-create Google Sheet sync failed", {
          orderId: result.orderId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    logger.info("ordersApi", "Order created successfully", { orderId: result.orderId });
    return NextResponse.json({ correlationId, ...result }, { status: 201 });
  }));
}
