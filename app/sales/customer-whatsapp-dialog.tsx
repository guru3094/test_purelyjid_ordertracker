"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./customer-whatsapp-dialog.module.css";

type Props = { orderId: string; onClose: () => void };

export default function CustomerWhatsAppDialog({ orderId, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [documentType, setDocumentType] = useState("");
  const yesButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    yesButton.current?.focus();
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape" && !busy) onClose(); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  async function send(productDecided: boolean) {
    setBusy(true); setError(""); setInvoiceUrl("");
    // Open on the click itself so browsers do not block the WhatsApp tab after the API call.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      const response = await fetch("/api/whatsapp/customer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, productDecided }),
      });
      const data = await response.json() as { error?: string; whatsappUrl?: string; invoiceUrl?: string; documentType?: string };
      if (response.status === 401) { tab?.close(); window.location.href = "/staff-login"; return; }
      if (!response.ok || !data.whatsappUrl || !data.invoiceUrl) throw new Error(data.error ?? "Could not prepare the customer message.");
      setInvoiceUrl(data.invoiceUrl); setDocumentType(data.documentType ?? "PDF");
      if (tab) tab.location.href = data.whatsappUrl;
      else window.location.href = data.whatsappUrl;
    } catch (cause) {
      tab?.close(); setError(cause instanceof Error ? cause.message : "Could not prepare the customer message.");
    } finally { setBusy(false); }
  }

  return <div className={styles.backdrop} onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="customer-whatsapp-title">
      <span className={styles.eyebrow}>PURELYJID · CUSTOMER MESSAGE</span>
      <h2 id="customer-whatsapp-title">Has the product been decided?</h2>
      <p>Order <strong>{orderId}</strong>. Choose what the customer should see before opening WhatsApp.</p>
      <div className={styles.choices}>
        <button ref={yesButton} type="button" disabled={busy} onClick={() => { void send(true); }}>
          <strong>Yes, product decided</strong><span>Send the product name, order amount, advance, balance and invoice PDF link.</span>
        </button>
        <button type="button" disabled={busy} onClick={() => { void send(false); }}>
          <strong>No, still deciding</strong><span>Send the advance only, with an advance receipt PDF link.</span>
        </button>
      </div>
      {busy && <p className={styles.note} role="status">Preparing the message from the Orders Google Sheet…</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {invoiceUrl && <p className={styles.note} role="status">WhatsApp is ready. Review the message and tap Send. <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">Open {documentType} PDF</a>.</p>}
      <button className={styles.close} type="button" disabled={busy} onClick={onClose}>Close</button>
    </section>
  </div>;
}
