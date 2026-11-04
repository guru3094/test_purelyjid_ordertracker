import { NextRequest, NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import { getCachedStaffOrders } from "@/lib/services/staffOrdersCacheService";
import { saveArtistOrderRequest } from "@/lib/services/artistOrderRequestService";

export async function POST(request: NextRequest) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const orderId = String(body.orderId ?? "").trim();
    if (!orderId) return NextResponse.json({ error: "Order ID is required." }, { status: 400 });

    const orders = await getCachedStaffOrders();
    const order = orders.find((item) => item.orderId === orderId);
    if (!order) return NextResponse.json({ error: "Order was not found." }, { status: 404 });

    await saveArtistOrderRequest({
      orderId: order.orderId,
      orderDate: order.orderDate,
      customerName: order.customerName,
      productName: order.productName || "Order",
      artistDetails: {
        requirements: body.requirements,
        artistCost: body.artistCost,
        artistAdvance: body.artistAdvance,
        estimatedDeliveryDate: body.estimatedDeliveryDate,
        comments: body.comments,
      },
    });

    return NextResponse.json({ success: true, orderId: order.orderId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create Artist order." },
      { status: 500 }
    );
  }
}
