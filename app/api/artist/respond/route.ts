import { NextRequest, NextResponse } from "next/server";
import { acceptArtistRequest } from "@/lib/services/artistOrderRequestService";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Acceptance token is required." }, { status: 400 });
    }
    const result = await acceptArtistRequest(token);
    const notifyNumber = (process.env.RESIN_ARTIST_ACCEPTANCE_NOTIFY_NUMBER ?? "").replace(/\D/g, "");
    const notifyText = [
      "PurelyJid Artist Acceptance",
      `Order ID: ${result.order.order_id}`,
      `Product: ${result.order.product_name}`,
      "",
      "I accept this order. ✅",
    ].join("\n");
    return NextResponse.json({
      success: true,
      duplicate: result.duplicate,
      orderId: result.order.order_id,
      notifyUrl: notifyNumber
        ? `https://wa.me/${notifyNumber}?text=${encodeURIComponent(notifyText)}`
        : null,
      message: result.order.artist_sheet_updated
        ? "Thank you for confirming the order again! 😊 Staff has been notified. The existing Artist Sheet entry has been checked and any revised product details updated."
        : "Thank you for accepting the order! 😊 All order details have been updated in the Resin Artist Order Sheet. Please check the sheet for the complete details.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not accept this order." },
      { status: 400 }
    );
  }
}
