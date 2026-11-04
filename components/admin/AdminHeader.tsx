"use client";

import Link from "next/link";

import BrandLogo from "@/components/branding/BrandLogo";

interface AdminHeaderProps {
  title?: string;
  description?: string;
}

export default function AdminHeader({
  title = "Order Management",
  description = "Manage and monitor customer orders",
}: AdminHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo priority />

          <div className="border-l border-slate-200 pl-4">
            <p className="text-sm font-bold text-slate-950 sm:text-base">
              {title}
            </p>

            <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">
              {description}
            </p>
          </div>
        </div>

        <nav
          aria-label="Admin navigation"
          className="flex items-center gap-2"
        >
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
          >
            Customer tracker
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Orders
          </Link>
        </nav>
      </div>
    </header>
  );
}
