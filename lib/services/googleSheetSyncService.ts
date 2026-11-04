import { readOrdersSheet } from "@/lib/google/sheets";
import { mapGoogleSheetRow } from "@/lib/google/mapper";

import { enqueue } from "@/lib/queue/writeQueue";
import { processQueue } from "@/lib/queue/queueProcessor";

import { Order } from "@/lib/types/order";

import {
  toIsoTimestamp,
  toNullableIsoTimestamp,
} from "@/lib/utils/date";

import { validateOrder } from "@/lib/validation/orderValidator";

import {
  createSyncExecution,
  updateSyncExecution,
} from "@/lib/supabase/syncExecutionRepository";

import {
  updateSyncCheckpoint,
} from "@/lib/supabase/syncCheckpointRepository";

function parseOptionalNumber(value?: string): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const normalized = value.replace(/[,₹$]/g, "").trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return parsed;
}

function parseProductCategory(value?: string): Order["productCategory"] {
  if (!value?.trim()) {
    return undefined;
  }

  const allowed = ["Workshop", "Resin Art", "Raw Materials"] as const;
  const match = allowed.find(
    (category) => category.toLowerCase() === value.trim().toLowerCase()
  );

  if (!match) {
    throw new Error(
      'Product Category must be "Workshop", "Resin Art", or "Raw Materials".'
    );
  }

  return match;
}

export async function syncGoogleSheet() {
  const executionStart = new Date().toISOString();

  const execution = await createSyncExecution({
    execution_start: executionStart,
    status: "RUNNING",
    rows_read: 0,
    rows_inserted: 0,
    rows_updated: 0,
    rows_failed: 0,
    error_message: null,
  });

  try {
    // Read Google Sheet
    const rows = await readOrdersSheet();

    if (rows.length <= 1) {
      await updateSyncExecution(execution.id, {
        execution_end: new Date().toISOString(),
        status: "SUCCESS",
        rows_read: 0,
        rows_inserted: 0,
        rows_updated: 0,
        rows_failed: 0,
      });

      return {
        success: true,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
        message: "No orders found in Google Sheet.",
      };
    }

    const dataRows = rows.slice(1);

    let successful = 0;
    let failed = 0;

    const errors: {
      orderId: string;
      message: string;
    }[] = [];

    for (const row of dataRows) {
      try {
        const googleRow = mapGoogleSheetRow(row);

        if (!googleRow.fulfillmentMethod) {
          throw new Error("Fulfilment method is blank or invalid in the Orders Google Sheet.");
        }

        const order: Order = {
          orderId: googleRow.orderId,
          customerName: googleRow.customerName,
          mobileNumber: googleRow.mobileNumber,

          email:
            googleRow.email &&
            googleRow.email.trim() !== ""
              ? googleRow.email
              : undefined,

          orderDate: toIsoTimestamp(
            googleRow.orderDate
          ),

          fulfillmentMethod:
            googleRow.fulfillmentMethod,

          status: googleRow.status,

          courierPartner:
            googleRow.courierPartner &&
            googleRow.courierPartner.trim() !== ""
              ? googleRow.courierPartner
              : undefined,

          trackingNumber:
            googleRow.trackingNumber &&
            googleRow.trackingNumber.trim() !== ""
              ? googleRow.trackingNumber
              : undefined,

          expectedDeliveryDate:
            toNullableIsoTimestamp(
              googleRow.expectedDeliveryDate
            ) ?? undefined,

          remarks:
            googleRow.remarks &&
            googleRow.remarks.trim() !== ""
              ? googleRow.remarks
              : undefined,

          productName:
            googleRow.productName &&
            googleRow.productName.trim() !== ""
              ? googleRow.productName
              : undefined,

          productCost: parseOptionalNumber(googleRow.productCost),
          advancePaid: parseOptionalNumber(googleRow.advancePaid),
          balanceToBePaid: parseOptionalNumber(googleRow.balanceToBePaid),
          productCategory: parseProductCategory(googleRow.productCategory),

          lastUpdated: toIsoTimestamp(
            googleRow.orderDate,
            googleRow.lastUpdated
          ),
        };

        validateOrder(order);

        enqueue({
          order,
          retryCount: 0,
          createdAt: new Date(),
        });

        successful++;
      } catch (error) {
        failed++;

        const googleRow = mapGoogleSheetRow(row);

        errors.push({
          orderId:
            googleRow.orderId || "Unknown",
          message:
            error instanceof Error
              ? error.message
              : "Unknown Error",
        });
      }
    }

    await processQueue();

    await updateSyncExecution(execution.id, {
      execution_end: new Date().toISOString(),
      status: failed > 0 ? "PARTIAL_SUCCESS" : "SUCCESS",
      rows_read: dataRows.length,
      rows_inserted: successful,
      rows_updated: 0,
      rows_failed: failed,
      error_message:
        errors.length > 0
          ? JSON.stringify(errors)
          : null,
    });

    await updateSyncCheckpoint(
      "GOOGLE_SHEETS_SYNC",
      new Date().toISOString()
    );

    return {
      success: true,
      processed: dataRows.length,
      successful,
      failed,
      errors,
    };
  } catch (error) {
    await updateSyncExecution(execution.id, {
      execution_end: new Date().toISOString(),
      status: "FAILED",
      error_message:
        error instanceof Error
          ? error.message
          : "Unknown Error",
    });

    throw error;
  }
}
