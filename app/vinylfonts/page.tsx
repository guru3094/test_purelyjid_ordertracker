import type { Metadata } from "next";
import SiteHeader from "@/components/homepage/SiteHeader";
import SiteFooter from "@/components/homepage/SiteFooter";
import VinylFontSelector from "./VinylFontSelector";
import CustomerArtworkSelector from "./CustomerArtworkSelector";

export const metadata: Metadata = {
  title: "Custom Vinyls | PurelyJid",
  description:
    "Order custom vinyl text and customer images from PurelyJid. Choose dimensions, colour and quantity, then send your selections on WhatsApp.",
};

export default function VinylFontsPage() {
  return (
    <main className="vinyl-page">
      <SiteHeader />
      <section className="vinyl-hero">
        <div className="vinyl-container vinyl-hero-inner">
          <div className="vinyl-hero-copy">
            <p className="vinyl-eyebrow">PURELYJID • MADE FOR YOU</p>
            <h1>Custom Vinyl,<br /><em>Your Way.</em></h1>
            <p className="vinyl-hero-description">
              Turn names, quotes and meaningful words into beautifully cut custom vinyl.
              Choose your exact text, size, color and signature PurelyJid font style.
            </p>
            <div className="vinyl-hero-badges" aria-label="Custom vinyl highlights">
              <span>8 Signature Fonts</span>
              <span>4 Vinyl Colors</span>
              <span>2.5–29 cm Text Width</span>
            </div>
          </div>

          <aside className="vinyl-next-day-card">
            <span className="vinyl-next-day-icon">✦</span>
            <p>QUICK TURNAROUND</p>
            <h2>Order today.<br />Ready the next day.</h2>
            <span>
              Finalise your custom vinyl selection today and we&apos;ll have it ready by the next day.
            </span>
          </aside>
        </div>
      </section>
      <div id="text-fonts"><VinylFontSelector /></div>
      <div id="upload-design"><CustomerArtworkSelector /></div>
      <SiteFooter />
    </main>
  );
}
