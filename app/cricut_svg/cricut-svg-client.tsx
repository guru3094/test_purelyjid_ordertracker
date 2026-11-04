"use client";

import { useRef, useState } from "react";
import { MAT_W, MAT_H, matSvg, matUtilization, matCuttingCost, nest, placementPath, type Design, type Mat } from "./nesting";
import { traceArtwork, type ArtworkOutline } from "./artwork-trace";
import { scaledArtworkSize, formatArtworkCm, type ArtworkSizeMode, type ArtworkBounds } from "./artwork-size";
import styles from "./cricut-svg.module.css";

const FONTS = [
  ["PF01", "Style Casual"], ["PF02", "Nexa Script"], ["PF03", "Style Script"],
  ["PF04", "Signatra Demo"], ["PF05", "Brush Script"], ["PF06", "Oleo Script"],
  ["PF07", "Stars & Love"], ["PF08", "Monarda"],
] as const;
type Row = { id: string; content: string; fontCode: string; width: string; quantity: string };
type Outline = { path: string; bounds: { x1: number; y1: number; x2: number; y2: number }; fillRule: "nonzero" | "evenodd" };
type ArtworkRow = { id: string; file: File | null; preview: string; link: string; sizeBy: ArtworkSizeMode; sizeValue: string; imageBounds: ArtworkBounds | null; quantity: string; threshold: string; minArea: string; invert: boolean; outline: ArtworkOutline | null; approved: boolean };
function row(): Row { return { id: crypto.randomUUID(), content: "", fontCode: "PF01", width: "", quantity: "1" }; }
function artworkRow(): ArtworkRow { return { id: crypto.randomUUID(), file: null, preview: "", link: "", sizeBy: "width", sizeValue: "", imageBounds: null, quantity: "1", threshold: "180", minArea: "8", invert: false, outline: null, approved: false }; }

function artworkDimensions(row: ArtworkRow) {
  return scaledArtworkSize(row.outline?.bounds ?? row.imageBounds, row.sizeBy, Number(row.sizeValue));
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function CricutSvgClient({ initialOrderNumber = "" }: { initialOrderNumber?: string }) {
  const [rows, setRows] = useState<Row[]>([row()]);
  const [artworks, setArtworks] = useState<ArtworkRow[]>([]);
  const [artworkBusy, setArtworkBusy] = useState("");
  const outlineCache = useRef(new Map<string, Outline>());
  const [spacing, setSpacing] = useState("2");
  const [allowRotation, setAllowRotation] = useState(true);
  const [mats, setMats] = useState<Mat[]>([]);
  const [error, setError] = useState("");
  const [seed, setSeed] = useState(1);
  const [working, setWorking] = useState(false);
  const [stale, setStale] = useState(false);
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [whatsAppError, setWhatsAppError] = useState("");
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);

  function invalidate() { setStale(true); setError(""); setWhatsAppError(""); }
  function update(id: string, field: keyof Omit<Row, "id">, value: string) {
    setRows(old => old.map(r => r.id === id ? { ...r, [field]: value } : r));
    invalidate();
  }
  function updateArtwork(id: string, changes: Partial<ArtworkRow>) {
    setArtworks(old => old.map(r => r.id === id ? { ...r, ...changes } : r));
    invalidate();
  }
  function setArtworkSizeBy(row: ArtworkRow, sizeBy: ArtworkSizeMode) {
    if (row.sizeBy === sizeBy) return;
    const size = artworkDimensions(row);
    updateArtwork(row.id, { sizeBy, sizeValue: size ? formatArtworkCm(sizeBy === "width" ? size.widthCm : size.heightCm) : "" });
  }
  async function chooseArtwork(id: string, file: File) {
    if (!["image/png", "image/jpeg"].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) {
      setError("Select a PNG, JPG, or JPEG image under 5 MB."); return;
    }
    let bitmap: ImageBitmap;
    try { bitmap = await createImageBitmap(file); }
    catch { setError("Could not read this image. Choose another PNG, JPG, or JPEG."); return; }
    const imageBounds = { x1: 0, y1: 0, x2: bitmap.width, y2: bitmap.height };
    bitmap.close();
    const previous = artworks.find(r => r.id === id)?.preview;
    if (previous) URL.revokeObjectURL(previous);
    updateArtwork(id, { file, preview: URL.createObjectURL(file), imageBounds, outline: null, approved: false });
  }
  async function importLink(id: string) {
    const input = artworks.find(r => r.id === id)?.link.trim();
    if (!input) { setError("Paste the image link from the customer's WhatsApp message."); return; }
    setError(""); setArtworkBusy(id);
    try {
      const url = new URL(input);
      if (!/^\/api\/vinyl-artwork\/[0-9a-f-]{36}$/.test(url.pathname) || !url.searchParams.get("token") ||
          ![window.location.origin, "https://purelyjid.in", "https://www.purelyjid.in"].includes(url.origin)) {
        throw new Error("Paste a PurelyJid customer image link.");
      }
      const response = await fetch(url.origin === window.location.origin ? url.toString() : `${url.pathname}${url.search}`);
      if (!response.ok) throw new Error("This image link is unavailable. Ask the customer to resend the image.");
      const blob = await response.blob();
      await chooseArtwork(id, new File([blob], `customer-artwork.${blob.type === "image/png" ? "png" : "jpg"}`, { type: blob.type }));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load the image."); }
    finally { setArtworkBusy(""); }
  }
  async function prepareArtwork(id: string) {
    const r = artworks.find(item => item.id === id);
    if (!r?.file) { setError("Select or load an image first."); return; }
    setError(""); setArtworkBusy(id);
    try {
      const threshold = Number(r.threshold);
      const minArea = Number(r.minArea);
      if (!Number.isFinite(threshold) || threshold < 1 || threshold > 254 || !Number.isFinite(minArea) || minArea < 0 || minArea > 1000) {
        throw new Error("Threshold must be 1–254 and tiny-shape removal must be 0–1000 pixels.");
      }
      const outline = await traceArtwork(r.file, threshold, r.invert, minArea);
      updateArtwork(id, { outline, approved: false });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not trace this image."); }
    finally { setArtworkBusy(""); }
  }

  async function makeDesigns(): Promise<Design[]> {
    const designs: Design[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const text = r.content.trim();
      if (!text && !r.width && artworks.length) continue;
      const widthCm = Number(r.width);
      const count = Number(r.quantity);
      if (!text || text.length > 100 || /[\r\n]/.test(text)) throw new Error(`Content ${i + 1}: enter one line of text (up to 100 characters).`);
      if (!Number.isFinite(widthCm) || widthCm < 0.1 || widthCm > 16) throw new Error(`Content ${i + 1}: width must be 0.1–16 cm.`);
      if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error(`Content ${i + 1}: quantity must be 1–100.`);
      const cacheKey = `${r.fontCode}\0${text}`;
      let outline = outlineCache.current.get(cacheKey);
      if (!outline) {
        const response = await fetch("/api/cricut-svg/outlines", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, fontCode: r.fontCode }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(`Content ${i + 1}: ${data.error || "Canva could not create a cut outline."}`);
        outline = data as Outline;
        outlineCache.current.set(cacheKey, outline);
      }
      // Canva's rendered ink bounds establish the exact physical width.
      const b = outline.bounds;
      const inkWidth = b.x2 - b.x1;
      const inkHeight = b.y2 - b.y1;
      const width = widthCm * 10;
      const scale = width / inkWidth;
      const design: Design = {
        id: r.id, sequence: 0, content: text, fontCode: r.fontCode,
        path: outline.path, fillRule: outline.fillRule, bounds: { x1: b.x1, y1: b.y1 },
        scale, width, height: inkHeight * scale,
      };
      if (!Number.isFinite(design.height) || design.height <= 0) throw new Error(`Content ${i + 1}: invalid font bounds.`);
      for (let j = 0; j < count; j++) designs.push({ ...design, sequence: designs.length });
      if (designs.length > 250) throw new Error("Limit this batch to 250 individual designs.");
    }
    for (let i = 0; i < artworks.length; i++) {
      const r = artworks[i];
      const requestedCm = Number(r.sizeValue);
      const count = Number(r.quantity);
      if (!r.file || !r.outline || !r.approved) throw new Error(`Image ${i + 1}: prepare and approve the cut contour before generating mats.`);
      if (!r.sizeValue || !Number.isFinite(requestedCm) || requestedCm < .1 || requestedCm > 16) throw new Error(`Image ${i + 1}: selected ${r.sizeBy} must be 0.1–16 cm for this mat.`);
      if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error(`Image ${i + 1}: quantity must be 1–100.`);
      const b = r.outline.bounds;
      const dimensions = scaledArtworkSize(b, r.sizeBy, requestedCm);
      if (!dimensions) throw new Error(`Image ${i + 1}: the cut contour has invalid dimensions.`);
      const scale = requestedCm * 10 / (r.sizeBy === "width" ? b.x2 - b.x1 : b.y2 - b.y1);
      const design: Design = { id: r.id, sequence: 0, content: r.file.name, fontCode: "IMAGE", path: r.outline.path,
        fillRule: "evenodd", bounds: { x1: b.x1, y1: b.y1 }, scale, width: dimensions.widthCm * 10, height: dimensions.heightCm * 10 };
      for (let j = 0; j < count; j++) designs.push({ ...design, sequence: designs.length });
      if (designs.length > 250) throw new Error("Limit this batch to 250 individual designs.");
    }
    if (!designs.length) throw new Error("Add at least one text design or customer image.");
    return designs;
  }

  async function optimize(again = false) {
    setError("");
    setWorking(true);
    try {
      const nextSeed = again ? seed + 173 : seed;
      const designs = await makeDesigns();
      const result = nest(designs, Number(spacing), allowRotation, nextSeed);
      setMats(result);
      setSeed(nextSeed);
      setStale(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to optimize this batch.");
      setMats([]);
    } finally { setWorking(false); }
  }

  function downloadMat(mat: Mat, index: number) {
    try {
      download(new Blob([matSvg(mat)], { type: "image/svg+xml;charset=utf-8" }), `purelyjid-cricut-joy-mat-${index + 1}-v3.svg`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to prepare the Cricut Joy SVG.");
    }
  }

  async function downloadAll() {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      mats.forEach((mat, index) => zip.file(`purelyjid-cricut-joy-mat-${index + 1}-v3.svg`, matSvg(mat)));
      download(await zip.generateAsync({ type: "blob" }), "purelyjid-cricut-joy-mats-v3.zip");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to prepare the SVG ZIP.");
    }
  }

  function openPriceWhatsApp() {
    setWhatsAppError("");
    if (!mats.length || stale) return;
    const entered = whatsAppNumber.trim().replace(/[\s().-]/g, "");
    if (!/^\+?\d+$/.test(entered)) {
      setWhatsAppError("Enter a valid WhatsApp number with its country code, or a 10-digit Indian mobile number.");
      return;
    }
    const digits = entered.replace(/^\+/, "");
    const indianMobile = !entered.startsWith("+") && digits.length === 10;
    const phone = indianMobile ? `91${digits}` : digits;
    if ((indianMobile && !/^[6-9]\d{9}$/.test(digits)) || !/^[1-9]\d{7,14}$/.test(phone)) {
      setWhatsAppError("Enter a 10-digit Indian mobile number or a full international number with country code.");
      return;
    }
    const total = mats.reduce((sum, mat) => sum + matCuttingCost(mat), 0);
    const quoteOrderNumber = orderNumber.trim().replace(/[\r\n]+/g, " ");
    const message = [
      "PurelyJid vinyl cutting price",
      ...(quoteOrderNumber ? [`Order number: ${quoteOrderNumber}`] : []),
      "Cutting contents:",
      ...rows.filter(r => r.content.trim()).map((r, index) => `${index + 1}. ${r.content.trim()} × ${Number(r.quantity)}`),
      ...artworks.map((r, index) => `${index + 1}. Customer Logo or Images: ${r.file?.name || "image"} × ${Number(r.quantity)}`),
      `Total cutting cost: ₹${total}`,
    ].join("\n");
    const link = document.createElement("a");
    link.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.append(link);
    link.click();
    link.remove();
  }

  const totalCuttingCost = mats.reduce((sum, mat) => sum + matCuttingCost(mat), 0);

  return <div className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.header}>
        {/* No navigation to customer vinyl flow: this is a separate staff utility. */}
        <div><span className={styles.eyebrow}>PURELYJID · PRODUCTION</span><h1>Cricut SVG Generator</h1>
          <p>Arrange Canva text and approved customer image contours on 11 × 16 cm vinyl mats.</p></div>
        <span className={styles.badge}>Internal tool</span>
      </header>

      <section className={styles.panel} aria-labelledby="fonts-heading">
        <div className={styles.sectionHeading}><h2 id="fonts-heading">1. Canva Pro fonts</h2><p>The eight PurelyJid fonts are rendered from your connected Canva template. No font files are needed. If Canva needs reconnecting, <a href="/api/canva/connect?next=%2Fcricut_svg" className={styles.link}>connect Canva</a> and return to this page.</p></div>
        <div className={styles.fontGrid}>{FONTS.map(([code, name]) => <div key={code} className={styles.fontCard}>
          <strong>{code}</strong><span>{name}</span><small>Canva template · page {Number(code.slice(2))}</small>
        </div>)}</div>
      </section>

      <section className={styles.panel} aria-labelledby="content-heading">
        <div className={styles.sectionHeading}><h2 id="content-heading">2. Enter contents</h2><p>Width applies to the complete content, including all its words. Words in one content stay on one cut line.</p></div>
        <div className={styles.rows}>{rows.map((r, index) => <div className={styles.row} key={r.id}>
          <div className={styles.rowTitle}><strong>Content {index + 1}</strong><button className={styles.textButton} type="button" disabled={rows.length === 1} onClick={() => { setRows(old => old.filter(x => x.id !== r.id)); invalidate(); }}>Remove</button></div>
          <div className={styles.fields}>
            <label className={styles.contentField}>Text / content<input value={r.content} maxLength={100} placeholder="e.g. Happy Birthday" onChange={e => update(r.id, "content", e.target.value)} /></label>
            <label>Font<select value={r.fontCode} onChange={e => update(r.id, "fontCode", e.target.value)}>{FONTS.map(([code, name]) => <option key={code} value={code}>{code} – {name}</option>)}</select></label>
            <label>Width (cm)<input type="number" min="0.1" max="16" step="0.1" value={r.width} placeholder="5.0" onChange={e => update(r.id, "width", e.target.value)} /></label>
            <label>Quantity<input type="number" min="1" max="100" step="1" value={r.quantity} onChange={e => update(r.id, "quantity", e.target.value)} /></label>
          </div>
        </div>)}</div>
        <button type="button" className={styles.secondary} onClick={() => { setRows(old => [...old, row()]); invalidate(); }}>+ Add content</button>
      </section>

      <section className={styles.panel} aria-labelledby="artwork-heading">
        <div className={styles.sectionHeading}><h2 id="artwork-heading">Customer Logo or Images</h2><p>Load the customer link from WhatsApp or upload the image directly. Set the width or height; the other dimension follows the image proportions and updates to the approved cut contour. Review the black cut contour and its holes before approving. Designs that exceed the mat need an agreed new size; the generator never shrinks them automatically.</p></div>
        <div className={styles.rows}>{artworks.map((r, index) => <div className={styles.row} key={r.id}>
          <div className={styles.rowTitle}><strong>Image {index + 1}</strong><button className={styles.textButton} type="button" onClick={() => { if (r.preview) URL.revokeObjectURL(r.preview); setArtworks(old => old.filter(x => x.id !== r.id)); invalidate(); }}>Remove</button></div>
          <div className={styles.artworkInputs}>
            <label>Customer image link<input type="url" placeholder="Paste link from WhatsApp" value={r.link} onChange={e => updateArtwork(r.id, { link: e.target.value })} /></label>
            <button type="button" className={styles.secondary} disabled={!!artworkBusy} onClick={() => { void importLink(r.id); }}>Load image</button>
            <label>Or upload PNG / JPG<input type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={e => { const file = e.target.files?.[0]; if (file) void chooseArtwork(r.id, file); }} /></label>
          </div>
          <div className={styles.artworkControls}>
            <label>Set size by<select value={r.sizeBy} onChange={e => setArtworkSizeBy(r, e.target.value as ArtworkSizeMode)}><option value="width">Width</option><option value="height">Height</option></select></label>
            <label>Width (cm)<input type="number" min="0.1" max="16" step="any" placeholder={r.sizeBy === "width" ? "5" : "Auto"} readOnly={r.sizeBy !== "width"} value={r.sizeBy === "width" ? r.sizeValue : artworkDimensions(r) ? formatArtworkCm(artworkDimensions(r)!.widthCm) : ""} onChange={e => updateArtwork(r.id, { sizeValue: e.target.value })} /></label>
            <label>Height (cm)<input type="number" min="0.1" max="16" step="any" placeholder={r.sizeBy === "height" ? "5" : "Auto"} readOnly={r.sizeBy !== "height"} value={r.sizeBy === "height" ? r.sizeValue : artworkDimensions(r) ? formatArtworkCm(artworkDimensions(r)!.heightCm) : ""} onChange={e => updateArtwork(r.id, { sizeValue: e.target.value })} /></label>
            <label>Quantity<input type="number" min="1" max="100" value={r.quantity} onChange={e => updateArtwork(r.id, { quantity: e.target.value })} /></label>
            <label>Contour threshold<input type="number" min="1" max="254" value={r.threshold} onChange={e => updateArtwork(r.id, { threshold: e.target.value, outline: null, approved: false })} /></label>
            <label>Remove tiny shapes (px²)<input type="number" min="0" max="1000" value={r.minArea} onChange={e => updateArtwork(r.id, { minArea: e.target.value, outline: null, approved: false })} /></label>
            <label className={styles.artworkCheck}><input type="checkbox" checked={r.invert} onChange={e => updateArtwork(r.id, { invert: e.target.checked, outline: null, approved: false })} /> Invert foreground</label>
          </div>
          {r.file && <p className={styles.artworkSizeHint}>{r.outline ? "Automatic dimension uses the cut contour, including only shapes you approved." : "Automatic dimension is estimated from image pixels until you prepare the cut contour."}</p>}
          {r.preview && <div className={styles.artworkPreview}>
            <div><span>Original image</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.preview} alt={`Original customer image ${index + 1}`} />
            </div>
            {r.outline && <div><span>Cut contour · {r.outline.pathCount} shapes</span><svg viewBox={`${r.outline.bounds.x1} ${r.outline.bounds.y1} ${r.outline.bounds.x2-r.outline.bounds.x1} ${r.outline.bounds.y2-r.outline.bounds.y1}`} role="img" aria-label={`Cut contour for image ${index + 1}`}><path d={r.outline.path} fill="#211b18" fillRule="evenodd" /></svg></div>}
          </div>}
          <div className={styles.actions}><button type="button" className={styles.secondary} disabled={!r.file || !!artworkBusy} onClick={() => { void prepareArtwork(r.id); }}>{artworkBusy === r.id ? "Preparing…" : "Prepare cut contour"}</button>
            {r.outline && <label className={styles.artworkCheck}><input type="checkbox" checked={r.approved} onChange={e => updateArtwork(r.id, { approved: e.target.checked })} /> I checked the cut contour and approve this image</label>}</div>
        </div>)}</div>
        <button type="button" className={styles.secondary} onClick={() => { setArtworks(old => [...old, artworkRow()]); invalidate(); }}>+ Add Customer Logo or Images</button>
      </section>

      <section className={styles.panel} aria-labelledby="settings-heading">
        <div className={styles.sectionHeading}><h2 id="settings-heading">3. Optimize mats</h2><p>Uses multiple free-space layouts across the whole batch to reduce mat count and fill gaps.</p></div>
        <div className={styles.settings}>
          <div className={styles.matSize}><span>VINYL MAT SIZE</span><strong>11 × 16 cm</strong><small>Joy cuttable area: 10.795 × 15.875 cm</small></div>
          <label>Order number (optional)<input type="text" maxLength={40} value={orderNumber} placeholder="e.g. PJ100001" onChange={e => setOrderNumber(e.target.value)} /></label>
          <label>Safe spacing (mm)<input type="number" min="0" max="10" step="0.5" value={spacing} onChange={e => { setSpacing(e.target.value); invalidate(); }} /></label>
          <label className={styles.check}><input type="checkbox" checked={allowRotation} onChange={e => { setAllowRotation(e.target.checked); invalidate(); }} /> Allow 90° rotation</label>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} disabled={working || !!artworkBusy} onClick={() => { void optimize(false); }}>{working ? "Preparing cut outlines…" : "Generate mats"}</button>
          {mats.length > 0 && <button type="button" className={styles.secondary} disabled={working} onClick={() => { void optimize(true); }}>Optimize Again</button>}
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </section>

      {mats.length > 0 && <section className={styles.results} aria-label="Generated mats">
        <div className={styles.resultHeading}><div><span className={styles.eyebrow}>PRODUCTION LAYOUT</span><h2>{mats.length} {mats.length === 1 ? "mat" : "mats"} generated</h2></div>
          <button type="button" className={styles.secondary} disabled={stale} onClick={() => { void downloadAll(); }}>Download all mats (ZIP)</button></div>
        {stale && <p className={styles.notice}>Inputs changed. Generate mats again before downloading.</p>}
        <div className={styles.whatsAppShare}>
          <label>Recipient WhatsApp number
            <input type="tel" inputMode="tel" autoComplete="tel" maxLength={24} value={whatsAppNumber} placeholder="e.g. +91 98765 43210" onChange={e => { setWhatsAppNumber(e.target.value); setWhatsAppError(""); }} />
          </label>
          <div className={styles.whatsAppTotal}><strong>₹{totalCuttingCost}</strong><span>Total cutting cost for {mats.length} {mats.length === 1 ? "mat" : "mats"}</span></div>
          <button type="button" className={styles.primary} disabled={stale || working} onClick={openPriceWhatsApp}>Send price via WhatsApp</button>
        </div>
        <p className={styles.whatsAppHint}>The order number is included in the price message when entered. A 10-digit Indian mobile number gets +91 automatically. WhatsApp opens with the price ready; review it and tap Send.</p>
        {whatsAppError && <p className={styles.error} role="alert">{whatsAppError}</p>}
        <div className={styles.matGrid}>{mats.map((mat, index) => {
          const percent = matUtilization(mat);
          return <article className={styles.matCard} key={index}>
            <div className={styles.matHeader}><div><span className={styles.eyebrow}>CUT LAYOUT</span><h3>MAT {index + 1} — 11 × 16 cm</h3></div><button type="button" className={styles.secondary} disabled={stale} onClick={() => downloadMat(mat, index)}>Download SVG</button></div>
            <div className={styles.previewWrap}><svg className={styles.preview} viewBox={`0 0 ${MAT_W} ${MAT_H}`} role="img" aria-label={`Mat ${index + 1} cut placement preview`}>
              {[...mat.placements].sort((a, b) => a.design.sequence - b.design.sequence).map((p, i) => {
                const path = placementPath(p);
                return <g key={i} transform={path.transform}><path d={path.d} fill="#211b18" fillRule={p.design.fillRule || "nonzero"} /></g>;
              })}
            </svg></div>
            <div className={styles.metrics}><div><strong>{mat.placements.length}</strong><span>designs</span></div><div><strong>{percent.toFixed(1)}%</strong><span>bounds utilization</span></div><div><strong>{(100 - percent).toFixed(1)}%</strong><span>estimated waste*</span></div><div><strong>₹{matCuttingCost(mat)}</strong><span>cutting cost*</span></div></div>
          </article>;
        })}</div>
        <p className={styles.note}>* Estimates use each design’s outline bounding rectangle; open letter shapes and unused interior spaces are counted as used. Cutting cost is ₹30 at 1% utilization and rises to ₹150 at 100%, rounded to the nearest rupee for each mat. The exported SVG contains only black vector cut paths and is cropped to the artwork bounds so Design Space does not import an empty 11 × 16 cm page as an oversized image. Relative placement and each design’s dimensions are retained. Verify scale and choose On Mat in Cricut Design Space before cutting.</p>
      </section>}
    </div>
  </div>;
}
