import { redirect } from "next/navigation";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import CreateSaleForm from "./create-sale-form";
export default async function CreateSalePage() { if (!(await isStaffAuthenticated())) redirect("/staff-login"); return <CreateSaleForm/>; }
