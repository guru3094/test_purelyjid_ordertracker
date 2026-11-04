import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",

  description:
    "Read PurelyJid's privacy policy regarding customer information and data protection.",

  alternates: {
    canonical: "/privacy",
  },
};

import SiteHeader from "@/components/homepage/SiteHeader";
import SiteFooter from "@/components/homepage/SiteFooter";
export default function PrivacyPage(){return <main className="home-page"><SiteHeader/><section className="page-hero"><div className="site-shell"><p className="kicker">Information</p><h1>Privacy Policy</h1><p>Last updated: March 2026</p></div></section><article className="site-shell legal-page"><h2>Information we collect</h2><p>We may collect details you provide for enquiries and orders, including your name, contact number, delivery address, order information and customisation preferences.</p><h2>How information is used</h2><p>Your information is used to respond to enquiries, create and fulfil orders, provide tracking updates, arrange delivery and support you after purchase.</p><h2>Sharing</h2><p>Relevant information may be shared with service providers such as payment, delivery or technology partners only when required to complete your order or operate our services.</p><h2>Your choices</h2><p>You may contact us on WhatsApp to request correction of inaccurate personal details associated with your order.</p></article><SiteFooter/></main>}
