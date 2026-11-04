"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function StaffNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/staff/logout", {
      method: "POST",
    });

    router.replace("/staff-login");
    router.refresh();
  }

  return (
    <aside className="sales-sidebar">
      <img
        src="/purelyjid-logo.png"
        alt="PurelyJid"
        className="sales-sidebar-logo"
      />

      <nav>
        <Link
          className={pathname === "/sales/create" ? "active" : ""}
          href="/sales/create"
        >
          Create Sale
        </Link>

        <Link
          className={pathname === "/sales/orders" ? "active" : ""}
          href="/sales/orders"
        >
          Orders
        </Link>

        <Link
          className={pathname === "/cricut_svg" ? "active" : ""}
          href="/cricut_svg"
        >
          Cricut SVG Generator
        </Link>
      </nav>

      <button
        type="button"
        className="sales-logout"
        onClick={logout}
      >
        Logout
      </button>
    </aside>
  );
}
