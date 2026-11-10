import type { Metadata } from "next";
import SiteHeader from "@/components/homepage/SiteHeader";
import SiteFooter from "@/components/homepage/SiteFooter";
import GiftCatalogue from "./GiftCatalogue";
import "./gifting.css";

export const metadata: Metadata = {
  title: "Last Minute Customer Gifting",
  description: "Personalised keychains, mugs, bottles, tumblers and photo gifts from PurelyJid. Explore quantity pricing and enquire on WhatsApp.",
  alternates: { canonical: "/last-minute-customer-gifting" },
};

export default function GiftingPage() {
  return <div className="vinyl-page gifting-page">
    <SiteHeader />
    <main>
      <section className="gift-hero">
        <div className="vinyl-container gift-hero-inner">
          <div><p className="vinyl-eyebrow">PURELYJID · PERSONALISED GIFTING</p>
            <h1>Last Minute<br /><em>Customer Gifting.</em></h1>
            <p className="gift-intro">Little gestures. Lasting impressions. Make it personal with names, photos, logos and messages on gifts for every occasion.</p>
            <a className="gift-browse" href="#gift-catalogue">Explore the gifts <span aria-hidden="true">↗</span></a>
          </div>
          <aside className="gift-hero-note"><span aria-hidden="true">✦</span><p>THOUGHTFULLY PERSONALISED</p><h2>One special gift.<br />Or a hundred thank-yous.</h2><p>Choose your favourite, set the quantity and see your price instantly.</p><div>15 gift options · Quantity savings</div></aside>
        </div>
      </section>
      <GiftCatalogue />
    </main>
    <SiteFooter />
  </div>;
}
