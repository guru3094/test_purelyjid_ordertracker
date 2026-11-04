import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",

  description:
    "Read PurelyJid's terms and conditions for customized handmade products.",

  alternates: {
    canonical: "/terms",
  },
};

import SiteHeader from "@/components/homepage/SiteHeader";
import SiteFooter from "@/components/homepage/SiteFooter";
export default function TermsPage(){return <main className="home-page"><SiteHeader/><section className="page-hero"><div className="site-shell"><p className="kicker">Information</p><h1>Terms &amp; Conditions</h1><p>Last updated: March 2026</p></div></section><article className="site-shell legal-page"><h2>Handmade products</h2><p>PurelyJid products are handmade. Natural variations in colour, placement, texture, bubbles or finish may occur and are part of the individual character of resin art.</p><h2>Custom orders</h2><p>Custom work begins after the design, expected timeline and payment terms are confirmed. Changes requested after production begins may not be possible or may involve additional cost.</p><h2>Images and colours</h2><p>Product photographs are representative. Screen settings and the handcrafted process may cause minor differences between images and the delivered item.</p><h2>Order concerns</h2><p>Contact us promptly on WhatsApp for order-related concerns. Resolution depends on the product type, evidence provided and the agreed customisation.</p></article><SiteFooter/></main>}
