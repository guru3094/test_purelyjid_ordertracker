import { NextRequest, NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import { getCachedStaffOrders } from "@/lib/services/staffOrdersCacheService";
import { createInvoiceLink, type InvoiceSnapshot } from "@/lib/invoice/links";
import { customerWhatsAppMessage } from "@/lib/invoice/customerMessage";
import { makeCustomerInvoicePdf } from "@/lib/invoice/pdf";

export const runtime = "nodejs";

function money(raw: string | undefined, field: string) {
  const value = String(raw ?? "").replace(/[₹,\s]/g, "").trim();
  const number = Number(value);
  if (!value || !Number.isFinite(number) || number < 0) throw new Error(`${field} is missing or invalid in the Orders Google Sheet.`);
  return number;
}
function customerPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  throw new Error("The customer mobile number in the Orders Google Sheet must be a valid Indian number.");
}

export async function POST(request: NextRequest) {
  if (!(await isStaffAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { orderId?: unknown; productDecided?: unknown };
    if (typeof body.orderId !== "string" || !body.orderId.trim() || typeof body.productDecided !== "boolean") {
      return NextResponse.json({ error: "Order ID and product decision are required." }, { status: 400 });
    }
    const orderId = body.orderId.trim();
    const order = (await getCachedStaffOrders()).find(item => item.orderId === orderId);
    if (!order) return NextResponse.json({ error: "Order was not found in the Orders Google Sheet." }, { status: 404 });
    const phone = customerPhone(order.mobileNumber);
    const advancePaid = money(order.advancePaid, "Advance paid");
    const productName = order.productName?.trim();
    const snapshot: InvoiceSnapshot = {
      orderId: order.orderId, orderDate: order.orderDate, customerName: order.customerName,
      fulfillmentMethod: order.fulfillmentMethod, advancePaid,
      mode: body.productDecided ? "invoice" : "advance",
    };
    if (body.productDecided) {
      if (!productName) throw new Error("Product name is missing in Orders Google Sheet column O. Update it before sending the invoice.");
      snapshot.productName = productName;
      snapshot.productCost = money(order.productCost, "Order amount");
      snapshot.balance = order.balanceToBePaid?.trim()
        ? money(order.balanceToBePaid, "Balance") : Math.max(0, snapshot.productCost - advancePaid);
    }
    // Validate the exact PDF before giving the customer a link to it.
    await makeCustomerInvoicePdf(snapshot);
    const invoiceUrl = createInvoiceLink(snapshot);
    const message = customerWhatsAppMessage(snapshot, invoiceUrl, order.productCategory, order.status, order.remarks);
    return NextResponse.json({ whatsappUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`, invoiceUrl,
      documentType: body.productDecided ? "invoice" : "advance receipt" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not prepare the customer message." }, { status: 400 });
  }
}
