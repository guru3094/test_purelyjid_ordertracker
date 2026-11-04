"use client";

import { useMemo, useState } from "react";

type FontPreview = { code: string; name: string; imageUrl: string };
type VinylColor = "Golden" | "White" | "Black" | "Holographic";
type ContentItem = {
  id: string;
  content: string;
  width: string;
  color: VinylColor | "";
  selectedFontCode: string | null;
  previews: FontPreview[];
};
type PreviewResponse = { success: boolean; previews?: FontPreview[]; error?: string };

const WHATSAPP_NUMBER = "919518770073";
const MIN_WIDTH = 2.5;
const MAX_WIDTH = 29;
function isValidWidth(width: string) {
  const value = Number(width);
  return Number.isFinite(value) && value >= MIN_WIDTH && value <= MAX_WIDTH;
}
const COLORS: VinylColor[] = ["Golden", "White", "Black", "Holographic"];
const FONT_LIST = [
  { code: "PF01", name: "Style Casual" },
  { code: "PF02", name: "Nexa Script" },
  { code: "PF03", name: "Style Script" },
  { code: "PF04", name: "Signatra Demo" },
  { code: "PF05", name: "Brush Script" },
  { code: "PF06", name: "Oleo Script" },
  { code: "PF07", name: "Stars & Love" },
  { code: "PF08", name: "Monarda" },
];

function newItem(): ContentItem {
  return {
    id: crypto.randomUUID(),
    content: "",
    width: "",
    color: "",
    selectedFontCode: null,
    previews: [],
  };
}



export default function VinylFontSelector() {
  const [items, setItems] = useState<ContentItem[]>([newItem()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const complete = useMemo(
    () =>
      items.every(
        (item) =>
          item.content.trim() &&
          isValidWidth(item.width) &&
          item.color &&
          item.selectedFontCode,
      ),
    [items],
  );

  function updateTextField(id: string, field: "content" | "width", value: string) {
    setItems((all) =>
      all.map((item) =>
        item.id === id
          ? { ...item, [field]: value, previews: [], selectedFontCode: null }
          : item,
      ),
    );
    setError("");
  }

  function updateColor(id: string, color: VinylColor | "") {
    setItems((all) => all.map((item) => (item.id === id ? { ...item, color } : item)));
    setError("");
  }

  async function generate() {
    setError("");

    if (items.some((item) => !item.content.trim())) {
      setError("Please enter the content for every custom vinyl.");
      return;
    }

    if (items.some(item => !isValidWidth(item.width))) {
      setError(`Width must be between ${MIN_WIDTH} cm and ${MAX_WIDTH} cm for every item.`);
      return;
    }

    if (items.some((item) => !item.color)) {
      setError("Please select a color for every custom vinyl.");
      return;
    }

    setBusy(true);
    try {
      const generated: ContentItem[] = [];
      for (const item of items) {
        const response = await fetch("/api/vinyl-fonts/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: item.content, width: item.width }),
        });
        const data = (await response.json()) as PreviewResponse;
        if (!response.ok || !data.success || !data.previews) {
          throw new Error(data.error || "Unable to generate Canva previews.");
        }
        generated.push({ ...item, previews: data.previews, selectedFontCode: null });
      }
      setItems(generated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to generate font previews.");
    } finally {
      setBusy(false);
    }
  }

  function sendWhatsApp() {
    if (!complete) return;

    const details = items
      .map((item, index) => {
        const font = FONT_LIST.find((entry) => entry.code === item.selectedFontCode);
        return `${index + 1}. Content: ${item.content.trim()}\nWidth: ${item.width} cm\nColor: ${item.color}\nFont: ${font?.code} - ${font?.name}`;
      })
      .join("\n\n");

    const message = `Hi PurelyJid, I have finalized my vinyl cutting selection.\n\n${details}\n\nPlease confirm my vinyl cutting request.`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <section className="vinyl-builder">
      <div className="vinyl-container">
        <div className="vinyl-builder-heading">
          <span className="vinyl-step-number">01</span>
          <div>
            <p className="vinyl-section-kicker">CREATE YOUR VINYL</p>
            <h2>Personalise Every Detail</h2>
            <p>Add your text, choose the finished width and select your vinyl color.</p>
          </div>
        </div>

        <div className="vinyl-content-list">
          {items.map((item, index) => (
            <article className="vinyl-content-card" key={item.id}>
              <div className="vinyl-content-card-header">
                <div>
                  <span className="vinyl-item-label">CUSTOM VINYL</span>
                  <h3>Content {index + 1}</h3>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="vinyl-remove-button"
                    disabled={busy}
                    onClick={() => setItems((all) => all.filter((entry) => entry.id !== item.id))}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="vinyl-input-grid">
                <div className="vinyl-field vinyl-field-content">
                  <label htmlFor={`content-${item.id}`}>Your text</label>
                  <input
                    id={`content-${item.id}`}
                    disabled={busy}
                    value={item.content}
                    maxLength={100}
                    placeholder="e.g. Jidnyasa"
                    onChange={(e) => updateTextField(item.id, "content", e.target.value)}
                  />
                  <small>Enter the text exactly as you want it cut.</small>
                </div>

                <div className="vinyl-field">
                  <label htmlFor={`width-${item.id}`}>Width</label>
                  <div className="vinyl-width-input">
                    <input
                      disabled={busy}
                      id={`width-${item.id}`}
                      type="number"
                      min={MIN_WIDTH}
                      max={MAX_WIDTH}
                      step="0.1"
                      value={item.width}
                      placeholder="5"
                      onChange={(e) => updateTextField(item.id, "width", e.target.value)}
                    />
                    <span>cm</span>
                  </div>
                  <small>{MIN_WIDTH}–{MAX_WIDTH} cm</small>
                </div>

                <div className="vinyl-field">
                  <label htmlFor={`color-${item.id}`}>Color</label>
                  <div className="vinyl-select-wrap">
                    <select
                      disabled={busy}
                      id={`color-${item.id}`}
                      value={item.color}
                      onChange={(e) => updateColor(item.id, e.target.value as VinylColor | "")}
                    >
                      <option value="" disabled>Select color</option>
                      {COLORS.map((color) => (
                        <option value={color} key={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                  <small>Choose your vinyl finish.</small>
                </div>
              </div>

              {item.previews.length > 0 && (
                <div className="vinyl-preview-section">
                  <div className="vinyl-preview-heading">
                    <span>FONT PREVIEW</span>
                    <h3>Select the Style You Love</h3>
                    <p>Choose one font for &quot;{item.content}&quot;.</p>
                  </div>
                  <div className="vinyl-font-grid">
                    {item.previews.map((preview) => {
                      const selected = item.selectedFontCode === preview.code;
                      return (
                        <button
                          type="button"
                          key={preview.code}
                          className={`vinyl-font-card ${selected ? "vinyl-font-card-selected" : ""}`}
                          aria-pressed={selected}
                          disabled={busy}
                          onClick={() =>
                            setItems((all) =>
                              all.map((entry) =>
                                entry.id === item.id
                                  ? { ...entry, selectedFontCode: preview.code }
                                  : entry,
                              ),
                            )
                          }
                        >
                          <div className="vinyl-font-preview-image">
                            {/* Canva returns temporary preview URLs, so a normal img is intentional here. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={preview.imageUrl} alt={`${item.content} in ${preview.name}`} />
                            {selected && <span className="vinyl-selected-check">✓</span>}
                          </div>
                          <div className="vinyl-font-card-footer">
                            <strong>{preview.code}</strong>
                            <span>{preview.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>

        <button
          type="button"
          className="vinyl-add-button"
          disabled={busy}
          onClick={() => setItems((all) => [...all, newItem()])}
        >
          <span>+</span> Add Another Content
        </button>

        <div className="vinyl-generate-area">
          <button type="button" className="vinyl-primary-button" disabled={busy} onClick={generate}>
            {busy ? "Generating Font Styles..." : "Generate Font Styles"}
          </button>
          <p>Your eight PurelyJid font previews will be generated for each content item.</p>
        </div>

        {error && <div className="vinyl-error" role="alert">{error}</div>}

        {items.some((item) => item.previews.length > 0) && (
          <section className="vinyl-review-section">
            <div className="vinyl-builder-heading">
              <span className="vinyl-step-number">02</span>
              <div>
                <p className="vinyl-section-kicker">FINAL CHECK</p>
                <h2>Review Your Selection</h2>
                <p>Confirm the text, size, color and font before sending your request.</p>
              </div>
            </div>

            <div className="vinyl-review-list">
              {items.map((item, index) => {
                const font = FONT_LIST.find((entry) => entry.code === item.selectedFontCode);
                return (
                  <div className="vinyl-review-card" key={item.id}>
                    <span className="vinyl-review-index">{String(index + 1).padStart(2, "0")}</span>
                    <div><span>Content</span><strong>{item.content}</strong></div>
                    <div><span>Width</span><strong>{item.width} cm</strong></div>
                    <div><span>Color</span><strong>{item.color || "Select a color"}</strong></div>
                    <div><span>Font</span><strong>{font ? `${font.code} - ${font.name}` : "Select a font"}</strong></div>
                  </div>
                );
              })}
            </div>

            <div className="vinyl-whatsapp-area">
              <p>Everything look right? Send your selection directly to PurelyJid.</p>
              <button
                type="button"
                className="vinyl-whatsapp-button"
                disabled={!complete}
                onClick={sendWhatsApp}
              >
                Send Selection on WhatsApp
              </button>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
