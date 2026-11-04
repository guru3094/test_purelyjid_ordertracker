import { NextResponse } from "next/server";

import { retryFailedOrders } from "@/lib/retry/retryFailedOrders";

export async function POST() {
  try {
    const result = await retryFailedOrders();

    return NextResponse.json(
      {
        success: true,
        message: "Failed orders replay completed successfully.",
        ...result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Failed to replay failed orders",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
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
