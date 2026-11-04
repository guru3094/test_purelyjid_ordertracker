import { redirect } from "next/navigation";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import EditOrderClient from "./edit-order-client";

export default async function EditOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  if (!(await isStaffAuthenticated())) redirect("/staff-login");
  const { orderId } = await params;
  return <EditOrderClient orderId={orderId} />;
}
