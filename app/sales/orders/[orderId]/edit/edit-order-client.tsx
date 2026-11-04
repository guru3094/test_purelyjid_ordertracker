"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import StaffNav from "../../../staff-nav";
import type { EditableOrder, FieldOptions, OrderField } from "@/lib/google/editOrder";
import { isDeliveryOnlyStatus } from "@/lib/tracking/statusStages";

type LoadResult = { order: EditableOrder; version: string; options: FieldOptions; error?: string };
type SaveResult = { success?: boolean; order?: EditableOrder; version?: string; error?: string };

function inputDate(value: string) {
  if (!value) return "";
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return value.slice(0, 10);
  return value; // Preserve unfamiliar Sheet date formats instead of silently clearing them.
}

function dateForForm(order: EditableOrder): EditableOrder {
  return {
    ...order,
    orderDate: inputDate(order.orderDate),
    expectedDeliveryDate: inputDate(order.expectedDeliveryDate),
  };
}

function amountBalance(cost: string, advance: string) {
  if (cost === "" || advance === "") return "";
  const difference = Number(cost) - Number(advance);
  return Number.isFinite(difference) ? String(Math.round(difference * 100) / 100) : "";
}

export default function EditOrderClient({ orderId }: { orderId: string }) {
  const [form, setForm] = useState<EditableOrder | null>(null);
  const [version, setVersion] = useState("");
  const [options, setOptions] = useState<FieldOptions>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const pickupWithDeliveryStatus = form?.fulfillmentMethod.trim().toLowerCase() === "pickup" && isDeliveryOnlyStatus(form.status);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/staff/orders/${encodeURIComponent(orderId)}`, { cache: "no-store" });
        if (response.status === 401) { window.location.href = "/staff-login"; return; }
        const data = await response.json() as LoadResult;
        if (!response.ok || !data.order) throw new Error(data.error ?? "Could not load this order.");
        if (!active) return;
        setForm(dateForForm(data.order));
        setVersion(data.version);
        setOptions(data.options);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this order.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [orderId]);

  function change(field: OrderField, value: string) {
    setForm((current) => {
      if (!current) return null;
      const next = { ...current, [field]: value };
      if (field === "productCost" || field === "advancePaid") {
        next.balanceToBePaid = amountBalance(next.productCost, next.advancePaid);
      }
      return next;
    });
    setError("");
    setSaved(false);
  }

  function field(field: OrderField, label: string, type: "text" | "email" | "tel" | "date" | "number" = "text", readOnly = false) {
    if (!form) return null;
    const pickupStatus = field === "status" && form.fulfillmentMethod.trim().toLowerCase() === "pickup";
    const list = pickupStatus ? options[field]?.filter((choice) => !isDeliveryOnlyStatus(choice)) : options[field];
    const includeCurrent = !pickupStatus || !isDeliveryOnlyStatus(form[field]);
    const choices = list?.length ? [...new Set([...(includeCurrent ? [form[field]] : []), ...list].filter(Boolean))] : [];
    return <label key={field}>{label}
      {(choices.length > 0 || pickupStatus) && !readOnly ?
        <select value={includeCurrent ? form[field] : ""} onChange={(event) => change(field, event.target.value)}>
          <option value="">Leave blank</option>
          {choices.map((choice) => <option key={choice} value={choice}>{choice.replaceAll("_", " ")}</option>)}
        </select> :
        <input type={type === "date" && form[field] && !/^\d{4}-\d{2}-\d{2}$/.test(form[field]) ? "text" : type}
          name={field} value={form[field]} onChange={(event) => change(field, event.target.value)}
          readOnly={readOnly} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} />}
    </label>;
  }

  function notes(fieldName: "remarks" | "syncError", label: string) {
    return <label className="staff-full">{label}
      <textarea rows={3} value={form?.[fieldName] ?? ""} onChange={(event) => change(fieldName, event.target.value)} />
    </label>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || saving) return;
    if (pickupWithDeliveryStatus) {
      setError("Select a valid Pickup status or leave it blank before saving.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch(`/api/staff/orders/${encodeURIComponent(orderId)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: form, version }),
      });
      if (response.status === 401) { window.location.href = "/staff-login"; return; }
      const data = await response.json() as SaveResult;
      if (!response.ok || !data.order || !data.version) throw new Error(data.error ?? "Could not save this order.");
      setForm(dateForForm(data.order));
      setVersion(data.version);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this order.");
    } finally { setSaving(false); }
  }

  return <div className="sales-shell"><StaffNav /><main className="sales-content">
    <section className="staff-card staff-order-edit-card">
      <div className="staff-order-edit-heading"><div><span className="orders-kicker">Sales Management</span>
        <h1>Edit Order {orderId}</h1>
        <p>All Orders Sheet columns are shown. Fields may be left blank. Order ID identifies the row, and Last Updated is set when you save.</p>
      </div><Link href="/sales/orders" className="staff-order-edit-back">Back to Orders</Link></div>
      {loading ? <p>Loading the latest Google Sheet values…</p> : form ?
        <form className="staff-grid staff-order-edit-form" onSubmit={submit}>
          <h2 className="staff-full">Order details</h2>
          {field("orderId", "Order ID (row identifier)", "text", true)}
          {field("orderDate", "Order Date", "date")}
          {field("lastUpdated", "Last Updated (automatic)", "text", true)}
          {field("status", "Status")}
          {pickupWithDeliveryStatus && <p className="staff-full staff-error" role="alert">This Pickup order currently has a delivery-only status. Select a Pickup status or <button type="button" onClick={() => change("status", "")}>clear the status</button> before saving.</p>}

          <h2 className="staff-full">Customer</h2>
          {field("customerName", "Customer Name")}
          {field("mobileNumber", "Mobile Number", "tel")}
          {field("email", "Email", "email")}

          <h2 className="staff-full">Fulfilment</h2>
          {field("fulfillmentMethod", "Fulfilment Method")}
          {field("courierPartner", "Courier Partner")}
          {field("trackingNumber", "Tracking Number")}
          {field("expectedDeliveryDate", "Expected Delivery Date", "date")}

          <h2 className="staff-full">Product and payment</h2>
          {field("productName", "Product Name / Order Details")}
          {field("productCategory", "Product Category")}
          {field("productCost", "Product Cost (₹)", "number")}
          {field("advancePaid", "Advance Paid (₹)", "number")}
          {field("balanceToBePaid", "Balance to be Paid (₹)", "number")}

          <h2 className="staff-full">Notes and synchronization</h2>
          {notes("remarks", "Remarks")}
          {field("syncStatus", "Sync Status")}
          {notes("syncError", "Sync Error")}

          <p className="staff-full order-edit-sync-note">The Sheet accepts blank values. Supabase tracking may skip a row if essential details such as customer name, status, or fulfilment are blank.</p>

          {error && <div className="staff-full staff-error" role="alert">{error}</div>}
          {saved && <div className="staff-full staff-success" role="status">Updated in Google Sheets. The existing cron sync is scheduled in the background for Supabase.</div>}
          <div className="staff-full staff-actions artist-order-actions">
            <Link href="/sales/orders" className="staff-order-edit-back">Cancel</Link>
            <button disabled={saving} type="submit">{saving ? "Saving to Google Sheets…" : "Update Order"}</button>
          </div>
        </form> : <div className="staff-error" role="alert">{error || "Could not load this order."}</div>}
    </section>
  </main></div>;
}
