import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import StaffNav from "@/app/sales/staff-nav";
import CricutSvgClient from "./cricut-svg-client";
import styles from "./cricut-svg.module.css";

export const metadata: Metadata = {
  title: "Cricut SVG Generator",
  robots: { index: false, follow: false },
};

export default async function CricutSvgPage({ searchParams }: { searchParams: Promise<{ orderId?: string | string[] }> }) {
  if (!(await isStaffAuthenticated())) redirect("/staff-login?next=%2Fcricut_svg");
  const params = await searchParams;
  const orderNumber = typeof params.orderId === "string" ? params.orderId.slice(0, 40) : "";
  return <div className="sales-shell">
    <StaffNav />
    <main className={`sales-content ${styles.staffContent}`}>
      <CricutSvgClient key={orderNumber} initialOrderNumber={orderNumber} />
    </main>
  </div>;
}
