import { NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import { getCachedStaffOrders } from "@/lib/services/staffOrdersCacheService";

export async function GET() {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getCachedStaffOrders();

  return NextResponse.json({
    orders,
    totalRecords: orders.length,
  });
}
