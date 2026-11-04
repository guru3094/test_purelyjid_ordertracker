"use client";
import { useEffect, useRef, useState } from "react";
import { hasProductPrice } from "@/lib/artist/product-review";
import styles from "./customer-whatsapp-dialog.module.css";
type Props = { orderId: string; onClose: () => void; onPrepared?: () => void; onOpened?: () => void };
export default function ArtistWhatsAppDialog({ orderId, onClose, onPrepared, onOpened }: Props) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [review, setReview] = useState(false), [product, setProduct] = useState(""), [url, setUrl] = useState("");
  const focusTarget = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    focusTarget.current?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); previous?.focus(); };
  }, [busy, onClose]);
  async function prepare() {
    if (busy) return;
    if (review && (!product.trim() || hasProductPrice(product))) { setError("Remove the price and keep the product description, dimensions and quantities."); return; }
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/whatsapp/artist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, ...(review ? { productNameOverride: product } : {}) }) });
      const result = await response.json();
      if (response.status === 401) { tab?.close(); window.location.href = "/staff-login"; return; }
      if (result.code === "ARTIST_DETAILS_NOT_FOUND") { tab?.close(); window.location.href = `/sales/artist-orders/create?orderId=${encodeURIComponent(orderId)}`; return; }
      if (result.code === "ARTIST_PRODUCT_REVIEW_REQUIRED") { tab?.close(); setReview(true); setProduct(result.productName); setError(result.error); return; }
      if (!response.ok || !result.whatsappUrl) throw new Error(result.error || "Could not prepare Artist WhatsApp message.");
      setUrl(result.whatsappUrl); onPrepared?.();
      if (tab) { tab.location.href = result.whatsappUrl; onOpened?.(); }
    } catch (cause) { tab?.close(); setError(cause instanceof Error ? cause.message : "Could not prepare the message."); }
    finally { setBusy(false); }
  }
  return <div className={styles.backdrop} onMouseDown={e => { if (e.currentTarget === e.target && !busy) onClose(); }}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="artist-message-heading">
      <span className={styles.eyebrow}>PURELYJID · ARTIST MESSAGE</span><h2 id="artist-message-heading">{review ? "Remove prices from the product name" : "Send request to artist"}</h2>
      <p>Order <strong>{orderId}</strong>. We check the product name for prices before preparing the message and acceptance link. Order remarks are not included.</p>
      {review && <label className={styles.productField}>Artist-facing product name<textarea autoFocus rows={6} maxLength={4000} value={product} disabled={busy || !!url} onChange={e => setProduct(e.target.value)} /><small>Only this artist request is changed. The customer’s original product name stays as entered. The corrected description is used in the artist message, acceptance page and artist sheet when accepted.</small></label>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {url ? <p className={styles.note} role="status">The artist message is ready. Review it and tap Send in WhatsApp. <a href={url} target="_blank" rel="noopener noreferrer" onClick={onOpened}>Open WhatsApp</a></p> : <div className={styles.choices}><button type="button" ref={focusTarget} disabled={busy} onClick={() => void prepare()}><strong>{busy ? "Checking request…" : review ? "Save corrected name & open WhatsApp" : "Check & open WhatsApp"}</strong></button></div>}
      <button type="button" className={styles.close} disabled={busy} onClick={onClose}>Close</button>
    </section>
  </div>;
}
