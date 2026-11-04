"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import StaffNav from "../../staff-nav";
import ArtistWhatsAppDialog from "../../artist-whatsapp-dialog";

type Order = {
  orderId: string;
  customerName: string;
  productName?: string;
  orderDate: string;
};

export default function ArtistOrderForm() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [showArtistMessage, setShowArtistMessage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    requirements: "",
    artistCost: "",
    artistAdvance: "",
    estimatedDeliveryDate: "",
    comments: "",
  });

  const balance = useMemo(
    () => Math.max(0, Number(form.artistCost || 0) - Number(form.artistAdvance || 0)),
    [form.artistCost, form.artistAdvance]
  );

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setError("Order ID is missing.");
        setLoadingOrder(false);
        return;
      }
      try {
        const response = await fetch("/api/staff/orders", { cache: "no-store" });
        if (response.status === 401) {
          window.location.href = "/staff-login";
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not load order.");
        const found = (data.orders ?? []).find((item: Order) => item.orderId === orderId);
        if (!found) throw new Error("Order was not found.");
        setOrder(found);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load order.");
      } finally {
        setLoadingOrder(false);
      }
    }
    loadOrder();
  }, [orderId]);

  function change(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    setSaving(true);
    setError("");
    try {
      if (Number(form.artistAdvance || 0) > Number(form.artistCost || 0)) {
        throw new Error("Artist advance cannot be greater than Artist cost.");
      }

      const saveResponse = await fetch("/api/staff/artist-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, ...form }),
      });
      const saveData = await saveResponse.json();
      if (saveResponse.status === 401) {
        window.location.href = "/staff-login";
        return;
      }
      if (!saveResponse.ok) throw new Error(saveData.error ?? "Could not create Artist order.");

      setShowArtistMessage(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create Artist order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sales-shell">
      <StaffNav />
      <main className="sales-content">
        <section className="staff-card artist-order-create-card">
          <div className="artist-order-create-heading">
            <div>
              <span className="artist-order-kicker">Resin Artist</span>
              <h1>Create Artist Order</h1>
              <p>Add the Artist details for this existing customer order. After saving, WhatsApp will open with the same secure acceptance journey.</p>
            </div>
          </div>

          {loadingOrder ? (
            <p>Loading order...</p>
          ) : error && !order ? (
            <div className="staff-error">{error}</div>
          ) : order ? (
            <>
              <div className="artist-source-order">
                <div><span>Order ID</span><strong>{order.orderId}</strong></div>
                <div><span>Customer</span><strong>{order.customerName}</strong></div>
                <div><span>Product</span><strong>{order.productName || "—"}</strong></div>
              </div>

              <form className="staff-grid" onSubmit={submit}>
                <label className="staff-full">Artist Requirements
                  <textarea name="requirements" rows={4} value={form.requirements} onChange={change} placeholder="Describe the work required from the Resin Artist" />
                </label>
                <label>Artist Cost (₹)
                  <input name="artistCost" type="number" min="0" step="0.01" value={form.artistCost} onChange={change} />
                </label>
                <label>Artist Advance (₹)
                  <input name="artistAdvance" type="number" min="0" step="0.01" value={form.artistAdvance} onChange={change} />
                </label>
                <label>Artist Balance (₹)
                  <input value={balance} readOnly />
                </label>
                <label>Estimated Delivery Date
                  <input name="estimatedDeliveryDate" type="date" value={form.estimatedDeliveryDate} onChange={change} />
                </label>
                <label className="staff-full">Artist Comments
                  <textarea name="comments" rows={3} value={form.comments} onChange={change} />
                </label>
                {error && <div className="staff-full staff-error">{error}</div>}
                <div className="staff-full staff-actions artist-order-actions">
                  <button type="button" className="artist-cancel-button" onClick={() => window.location.href = "/sales/orders"}>Cancel</button>
                  <button type="submit" disabled={saving}>{saving ? "Preparing WhatsApp..." : "Create & Send to Artist"}</button>
                </div>
              </form>
            </>
          ) : null}
        </section>
      </main>
      {showArtistMessage && order && <ArtistWhatsAppDialog orderId={order.orderId} onClose={() => setShowArtistMessage(false)} onOpened={() => { window.location.href = "/sales/orders"; }} />}
    </div>
  );
}
