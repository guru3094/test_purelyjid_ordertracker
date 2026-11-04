import { NextResponse } from "next/server";

import {
    enqueue,
    getQueueSize
} from "@/lib/queue/writeQueue";

import { processQueue } from "@/lib/queue/queueProcessor";

export async function GET() {

    enqueue({

        order: {
  orderId: "PJ100999",
  customerName: "Queue Test Updated",
  mobileNumber: "9999999999",
  email: "queue@test.com",
  orderDate: "2026-07-12T20:05:12.082Z",

  fulfillmentMethod: "Delivery",

  status: "SHIPPED",

  courierPartner: "DTDC",

  trackingNumber: "DTDC999999",

  expectedDeliveryDate: "2026-07-15T10:00:00Z",

  remarks: "Updated via Queue Test",

  lastUpdated: new Date().toISOString(),
},

        retryCount: 0,

        createdAt: new Date()

    });

    const before = getQueueSize();

    await processQueue();

    const after = getQueueSize();

    return NextResponse.json({

        success: true,

        before,

        after

    });

}
