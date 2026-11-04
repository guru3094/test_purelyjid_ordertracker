import { NextResponse } from "next/server";
import { validateOrder } from "@/lib/validation/orderValidator";

export async function GET() {
  try {
    validateOrder({
      orderId: "PJ100001",
      customerName: "John Doe",
      mobileNumber: "9876543210",
      email: "john@example.com",
      orderDate: new Date().toISOString(),
      fulfillmentMethod: "Pickup",
      status: "ORDER_RECEIVED",
      courierPartner: "",
      trackingNumber: "",
      expectedDeliveryDate: "",
      remarks: "",
      lastUpdated: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Validation passed",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 400 }
    );
  }
}
