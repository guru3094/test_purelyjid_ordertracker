import { NextRequest, NextResponse } from "next/server";
import { verifyInvoiceToken } from "@/lib/invoice/links";
import { makeCustomerInvoicePdf } from "@/lib/invoice/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const invoice = verifyInvoiceToken(request.nextUrl.searchParams.get("token"));
  if (!invoice) return NextResponse.json({ error: "This invoice link is invalid or has expired. Request a new link from PurelyJid." }, { status: 404 });
  try {
    const bytes = await makeCustomerInvoicePdf(invoice);
    const filename = `PurelyJid-${invoice.mode === "invoice" ? "invoice" : "advance-receipt"}-${invoice.orderId}.pdf`;
    return new NextResponse(new Uint8Array(bytes), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    } });
  } catch (error) {
    console.error("Customer invoice generation failed:", error);
    return NextResponse.json({ error: "Could not generate this PDF. Contact PurelyJid." }, { status: 500 });
  }
}
