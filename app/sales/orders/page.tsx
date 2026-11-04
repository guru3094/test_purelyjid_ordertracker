import { redirect } from "next/navigation";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import OrdersClient from "./orders-client";
export default async function OrdersPage(){if(!(await isStaffAuthenticated()))redirect("/staff-login");return <OrdersClient/>;}
