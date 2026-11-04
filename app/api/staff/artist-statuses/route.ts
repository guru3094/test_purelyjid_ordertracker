import { NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import { getCachedStaffOrders } from "@/lib/services/staffOrdersCacheService";
import { getArtistOrderStatuses } from "@/lib/services/artistOrderStatusService";

export async function GET() {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const orders = await getCachedStaffOrders();
    const statuses = await getArtistOrderStatuses(orders.map((order) => order.orderId));
    return NextResponse.json({ statuses }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load Artist acceptance statuses." }, { status: 500 });
  }
}
