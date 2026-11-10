import { ImageResponse } from "next/og";

export const alt = "PurelyJid Quick Gifts – personalised mugs, keychains and photo gifts in Pune";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "#f4ebdc", color: "#26373b", padding: "60px 80px", borderTop: "14px solid #946b38" }}>
      <div style={{ display: "flex", fontSize: 25, letterSpacing: "5px", color: "#946b38", marginBottom: 32 }}>PURELYJID · PUNE</div>
      <div style={{ display: "flex", fontSize: 94, fontWeight: 700 }}>Quick Gifts.</div>
      <div style={{ display: "flex", fontSize: 57, color: "#946b38", marginBottom: 34 }}>Made personal.</div>
      <div style={{ display: "flex", fontSize: 28 }}>Mugs · Keychains · Bottles · Photo gifts</div>
      <div style={{ display: "flex", fontSize: 25, marginTop: 42 }}>Personalise. Preview in 360°. Order on WhatsApp.</div>
    </div>,
    size,
  );
}
