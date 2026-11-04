import { redirect } from "next/navigation";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import StaffLoginForm from "./staff-login-form";
export default async function StaffLoginPage({ searchParams }: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  // Explicit allowlist prevents the login page becoming an open redirect.
  const destination = (await searchParams).next === "/cricut_svg" ? "/cricut_svg" : "/sales/create";
  if (await isStaffAuthenticated()) redirect(destination);
  return <StaffLoginForm destination={destination} />;
}
