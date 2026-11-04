import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy",

  description:
    "Read PurelyJid's shipping policy, dispatch timelines and delivery information.",

  alternates: {
    canonical: "/shipping",
  },
};

import SiteHeader from "@/components/homepage/SiteHeader";
import SiteFooter from "@/components/homepage/SiteFooter";
export default function ShippingPage(){return <main className="home-page"><SiteHeader/><section className="page-hero"><div className="site-shell"><p className="kicker">Information</p><h1>Shipping Policy</h1><p>Last updated: March 2026</p></div></section><article className="site-shell legal-page"><h2>Processing and dispatch</h2><p>As most PurelyJid products are handmade or customised, processing time varies by product and design. The expected timeline will be confirmed when your order is accepted.</p><h2>Delivery</h2><p>Orders are shipped through available courier partners across India. Delivery timelines are estimates and may vary due to location, weather, holidays or courier delays.</p><h2>Packaging and damage</h2><p>Every order is packed carefully. Please record an unboxing video from the moment the sealed package is opened. Report visible damage promptly on WhatsApp with the video and photographs.</p><h2>Tracking</h2><p>Once your order is added to our tracking system, use the Track Order page with your order ID and registered mobile number.</p></article><SiteFooter/></main>}
