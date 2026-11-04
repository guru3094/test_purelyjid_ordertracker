import { config } from "@/lib/config";

import { enqueue } from "@/lib/queue/writeQueue";
import { processQueue } from "@/lib/queue/queueProcessor";

import {
  getPendingFailedOrders,
  resolveFailedOrder,
  incrementRetryCount,
  abandonFailedOrder,
} from "@/lib/supabase/failedOrdersRepository";

import { mapFailedOrderToOrder } from "@/lib/mappers/failedOrderMapper";

export async function retryFailedOrders() {
  const failedOrders = await getPendingFailedOrders();

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const failedOrder of failedOrders) {
    try {
      const order = mapFailedOrderToOrder(failedOrder);

      enqueue({
        order,
        retryCount: failedOrder.retry_count + 1,
        createdAt: new Date(),
      });

      const result = await processQueue();

      inserted += result.inserted;
      updated += result.updated;
      failed += result.failed;

      if (result.failed === 0) {
        await resolveFailedOrder(failedOrder.id);
      } else {
        const newRetryCount = failedOrder.retry_count + 1;

        if (newRetryCount >= config.retry.maxRetryCount) {
          await abandonFailedOrder(failedOrder.id);
        } else {
          await incrementRetryCount(
            failedOrder.id,
            newRetryCount
          );
        }
      }
    } catch (error) {
      failed++;

      const newRetryCount = failedOrder.retry_count + 1;

      if (newRetryCount >= config.retry.maxRetryCount) {
        await abandonFailedOrder(failedOrder.id);
      } else {
        await incrementRetryCount(
          failedOrder.id,
          newRetryCount
        );
      }

      console.error(
        `Retry failed for Order ${failedOrder.order_id}`,
        error
      );
    }
  }

  return {
    retried: failedOrders.length,
    inserted,
    updated,
    failed,
  };
}
