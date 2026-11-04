import { logger } from "@/lib/logger/logger";

import {
  dequeue,
  isQueueEmpty,
} from "./writeQueue";

import {
  findOrderByOrderId,
  insertOrder,
  updateOrder,
} from "@/lib/supabase/ordersRepository";

import { mapOrderToDb } from "@/lib/mappers/orderMapper";

import { getStatusByCode } from "@/lib/supabase/statusRepository";
import { getCourierByName } from "@/lib/supabase/courierRepository";

export interface QueueProcessingResult {
  inserted: number;
  updated: number;
  failed: number;
}

export async function processQueue(): Promise<QueueProcessingResult> {
  const result: QueueProcessingResult = {
    inserted: 0,
    updated: 0,
    failed: 0,
  };

  while (!isQueueEmpty()) {
    const item = dequeue();

    if (!item) {
      continue;
    }

    try {
      /*
       * STEP 1
       * Resolve Status UUID
       */
      const status = await getStatusByCode(item.order.status);

      if (!status) {
        throw new Error(
          `Status '${item.order.status}' not found in order_status_master`
        );
      }

      /*
       * STEP 2
       * Resolve Courier UUID
       */
      let courierId: string | null = null;

      if (
        item.order.fulfillmentMethod === "Delivery" &&
        item.order.courierPartner
      ) {
        const courier = await getCourierByName(
          item.order.courierPartner
        );

        if (!courier) {
          throw new Error(
            `Courier '${item.order.courierPartner}' not found in courier_master`
          );
        }

        courierId = courier.id;
      }

      /*
       * STEP 3
       * Map to database model
       */
      const dbOrder = mapOrderToDb(
        item.order,
        status.id,
        courierId
      );

      /*
       * STEP 4
       * Check whether order exists
       */
      const existingOrder = await findOrderByOrderId(
        item.order.orderId
      );

      /*
       * STEP 5
       * Update or Insert
       */
      if (existingOrder) {
        await updateOrder(
          item.order.orderId,
          dbOrder
        );

        result.updated++;

        logger.info(
          "queueProcessor",
          "Order updated successfully",
          {
            orderId: item.order.orderId,
          }
        );
      } else {
        await insertOrder(dbOrder);

        result.inserted++;

        logger.info(
          "queueProcessor",
          "Order inserted successfully",
          {
            orderId: item.order.orderId,
          }
        );
      }
    } catch (error) {
      result.failed++;

      logger.error(
        "queueProcessor",
        "Queue processing failed",
        {
          orderId: item.order.orderId,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        }
      );
    }
  }

  return result;
}
