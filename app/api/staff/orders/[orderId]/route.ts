import { after, NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import { EditableOrder, getOrderForEdit, ORDER_FIELDS, updateSheetOrder } from "@/lib/google/editOrder";
import { STAFF_ORDERS_CACHE_TAG } from "@/lib/services/staffOrdersCacheService";
import { GET as runExistingCronSync } from "@/app/api/cron/google-sheet-sync/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Context = { params: Promise<{ orderId: string }> };

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Could not update the order.";
  const status = message.includes("changed in Google Sheets") ? 409
    : message.includes("not found") ? 404
      : /Reload|cannot be changed|must be|Select a valid|Enter a valid/.test(message) ? 400 : 502;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(_request: NextRequest, { params }: Context) {
  if (!(await isStaffAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { orderId } = await params;
    const result = await getOrderForEdit(orderId);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (!(await isStaffAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { orderId } = await params;
    const body = await request.json() as { version?: unknown; order?: Partial<EditableOrder> };
    if (!body || typeof body.version !== "string" || !body.order || typeof body.order !== "object" ||
        ORDER_FIELDS.some((field) => typeof body.order?.[field] !== "string")) {
      return NextResponse.json({ error: "Submit every Orders Sheet column as a string; blank values are allowed." }, { status: 400 });
    }
    // Do not write an order if the existing cron route cannot be authorized afterward.
    const secret = process.env.CRON_SECRET;
    if (!secret) return NextResponse.json({ error: "CRON_SECRET is required to start the post-update sync." }, { status: 503 });

    // This Google Sheets API write completes before the response is sent.
    const saved = await updateSheetOrder(orderId, body.version, body.order as EditableOrder);
    revalidateTag(STAFF_ORDERS_CACHE_TAG, { expire: 0 });

    const cronUrl = new URL("/api/cron/google-sheet-sync", request.url);
    after(async () => {
      try {
        // Reuse the existing cron API handler without a self-HTTP request or sending
        // the cron secret through an external hostname.
        const cronRequest = new NextRequest(cronUrl, { headers: { authorization: `Bearer ${secret}` } });
        const response = await runExistingCronSync(cronRequest);
        const result = await response.json();
        if (!response.ok || result.result?.failed) console.error("Post-edit order sync did not fully complete:", orderId, result);
      } catch (error) {
        console.error("Post-edit order sync failed:", orderId, error);
      }
    });

    return NextResponse.json({ success: true, ...saved, syncScheduled: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
