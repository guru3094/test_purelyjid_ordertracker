"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./customer-artwork.module.css";

const COLORS = ["Golden", "White", "Black", "Holographic"] as const;
type Artwork = { id: string; file: File | null; preview: string; width: string; quantity: string; color: string };
const blank = (): Artwork => ({ id: crypto.randomUUID(), file: null, preview: "", width: "", quantity: "1", color: "" });

export default function CustomerArtworkSelector() {
  const [items, setItems] = useState<Artwork[]>([blank()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const previews = useRef(new Set<string>());
  useEffect(() => () => { previews.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  function update(id: string, changes: Partial<Artwork>) {
    setItems((all) => all.map((item) => item.id === id ? { ...item, ...changes } : item));
    setError("");
  }
  function choose(id: string, file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 5 * 1024 * 1024 || !file.size) {
      setError("Choose a PNG, JPG, or JPEG image under 5 MB.");
      return;
    }
    const previous = items.find((item) => item.id === id)?.preview;
    if (previous) { URL.revokeObjectURL(previous); previews.current.delete(previous); }
    const preview = URL.createObjectURL(file);
    previews.current.add(preview);
    update(id, { file, preview });
  }
  function remove(item: Artwork) {
    if (item.preview) { URL.revokeObjectURL(item.preview); previews.current.delete(item.preview); }
    setItems((all) => all.filter((entry) => entry.id !== item.id));
  }

  async function send() {
    setError("");
    for (const item of items) {
      if (!item.file || !item.color || !(Number(item.width) >= 2.5 && Number(item.width) <= 29) ||
          !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 100) {
        setError("For every image, choose a file and color, enter a width of 2.5–29 cm and a quantity of 1–100.");
        return;
      }
    }
    // Open while handling the click so browsers permit navigation after upload completes.
    const whatsapp = window.open("", "_blank");
    setBusy(true);
    try {
      const details: string[] = [];
      for (const [index, item] of items.entries()) {
        const form = new FormData();
        form.append("file", item.file!);
        const response = await fetch("/api/vinyl-artwork", { method: "POST", body: form });
        const result = await response.json() as { url?: string; error?: string };
        if (!response.ok || !result.url) throw new Error(result.error || "Could not upload your image.");
        details.push(`${index + 1}. Customer Logo or Images: ${item.file!.name}\nWidth: ${item.width} cm\nQuantity: ${item.quantity}\nColor: ${item.color}\nImage: ${result.url}`);
      }
      const message = `Hi PurelyJid, I would like these vinyl images cut.\n\n${details.join("\n\n")}\n\nPlease review the images and confirm my request.`;
      const url = `https://wa.me/919518770073?text=${encodeURIComponent(message)}`;
      if (whatsapp) whatsapp.location.href = url;
      else window.location.href = url;
    } catch (cause) {
      whatsapp?.close();
      setError(cause instanceof Error ? cause.message : "Could not prepare the request.");
    } finally { setBusy(false); }
  }

  return <section className={styles.section} aria-labelledby="customer-art-heading">
    <div className={styles.inner}>
      <div className={styles.heading}>
        <span className={styles.kicker}>CUSTOM ARTWORK</span>
        <h2 id="customer-art-heading">Customer Logo or Images</h2>
        <p>Have a logo or image instead of text? Upload PNG, JPG, or JPEG. We review the artwork before preparing a cut file and will contact you if a clearer image is needed.</p>
      </div>
      <div className={styles.list}>{items.map((item, index) => <div className={styles.card} key={item.id}>
        <div className={styles.cardHead}><strong>Image {index + 1}</strong>{items.length > 1 && <button type="button" onClick={() => remove(item)} disabled={busy}>Remove</button>}</div>
        <div className={styles.fields}>
          <label className={styles.upload}>Upload image<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" disabled={busy} onChange={(event) => choose(item.id, event.target.files?.[0])} /><small>PNG, JPG, or JPEG · up to 5 MB</small></label>
          <label>Width (cm)<input type="number" min="2.5" max="29" step="0.1" placeholder="5" value={item.width} onChange={(event) => update(item.id, { width: event.target.value })} /></label>
          <label>Quantity<input type="number" min="1" max="100" step="1" value={item.quantity} onChange={(event) => update(item.id, { quantity: event.target.value })} /></label>
          <label>Vinyl color<select value={item.color} onChange={(event) => update(item.id, { color: event.target.value })}><option value="">Select color</option>{COLORS.map((color) => <option key={color}>{color}</option>)}</select></label>
        </div>
        {item.preview && <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.preview} alt={`Uploaded artwork ${index + 1}`} /><span>{item.file?.name}</span>
        </div>}
      </div>)}</div>
      <div className={styles.actions}><button type="button" className={styles.secondary} disabled={busy} onClick={() => setItems((all) => [...all, blank()])}>+ Add image</button><button type="button" className={styles.primary} disabled={busy} onClick={() => { void send(); }}>{busy ? "Uploading images…" : "Send Images on WhatsApp"}</button></div>
      <p className={styles.hint}>WhatsApp opens with image links and your selections. Review the message and tap Send.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  </section>;
}
