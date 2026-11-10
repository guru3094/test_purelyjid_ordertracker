import type { Metadata } from "next";
import SiteHeader from "@/components/homepage/SiteHeader";
import SiteFooter from "@/components/homepage/SiteFooter";
import GiftCatalogue from "./GiftCatalogue";
import { products } from "./products";
import "./gifting.css";

const pageUrl = "https://www.purelyjid.in/last-minute-customer-gifting";
const title = "Quick Gifts – Personalised Gifts in Pune";
const description = "Personalise mugs, keychains, bottles and photo gifts in Pune. See quantity prices, adjust your photo in a 360° mockup and submit your order on WhatsApp.";
const socialImage = { url: `${pageUrl}/opengraph-image`, width: 1200, height: 630, alt: "PurelyJid Quick Gifts – personalised mugs, keychains and photo gifts in Pune" };

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: pageUrl },
  openGraph: { title: `${title} | PurelyJid`, description, url: pageUrl, siteName: "PurelyJid", locale: "en_IN", type: "website", images: [socialImage] },
  twitter: { card: "summary_large_image", title: `${title} | PurelyJid`, description, images: [socialImage] },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "CollectionPage", "@id": `${pageUrl}#page`, url: pageUrl, name: title, description, inLanguage: "en-IN", mainEntity: { "@id": `${pageUrl}#catalogue` } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "PurelyJid", item: "https://www.purelyjid.in/" },
      { "@type": "ListItem", position: 2, name: "Quick Gifts", item: pageUrl },
    ] },
    { "@type": "ItemList", "@id": `${pageUrl}#catalogue`, name: "Quick Gifts catalogue", numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem", position: index + 1,
        item: { "@type": "Product", "@id": `${pageUrl}#${product.id}`, name: `${product.name} – ${product.detail}`, description: `Personalised ${product.name.toLowerCase()}. ${product.detail}. Quantity prices are per piece.`, category: product.category, brand: { "@type": "Brand", name: "PurelyJid" },
          offers: product.tiers.map((tier, tierIndex) => ({ "@type": "Offer", url: `${pageUrl}#gift-catalogue`, price: tier.price, priceCurrency: "INR", seller: { "@type": "Organization", name: "PurelyJid", url: "https://www.purelyjid.in/" },
            eligibleQuantity: { "@type": "QuantitativeValue", minValue: tier.min, ...(product.tiers[tierIndex + 1] ? { maxValue: product.tiers[tierIndex + 1].min - 1 } : {}), unitCode: "C62" },
            description: `₹${tier.price} per piece for ${tier.min}${product.tiers[tierIndex + 1] ? `–${product.tiers[tierIndex + 1].min - 1}` : "+"} pieces`,
          })),
        },
      })),
    },
  ],
};

export default function GiftingPage() {
  return <div className="vinyl-page gifting-page">
    <SiteHeader />
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <section className="gift-hero">
        <div className="vinyl-container gift-hero-inner">
          <div><p className="vinyl-eyebrow">PURELYJID · PERSONALISED GIFTS IN PUNE</p>
            <h1>Quick Gifts.<br /><em>Made personal.</em></h1>
            <p className="gift-intro">Personalised mugs, keychains, bottles and photo gifts for birthdays, return gifts and customer thank-yous. Add your photos, names or logo, preview your design and send your selection to our Pune studio on WhatsApp.</p>
            <a className="gift-browse" href="#gift-catalogue">Explore the gifts <span aria-hidden="true">↗</span></a>
          </div>
          <aside className="gift-hero-note"><span aria-hidden="true">✦</span><p>THOUGHTFULLY PERSONALISED</p><h2>One special gift.<br />Or a hundred thank-yous.</h2><p>Choose your favourite, set the quantity and see your price instantly.</p><div>15 gift options · Quantity savings</div></aside>
        </div>
      </section>
      <GiftCatalogue />
      <section className="vinyl-container gift-discovery" aria-labelledby="gift-guide-title">
        <p className="vinyl-eyebrow">PERSONAL GESTURES · SIMPLE STEPS</p>
        <h2 id="gift-guide-title">Personalised gifts from our Pune studio</h2>
        <p>Explore custom photo mugs, single-sided wooden and acrylic keychains, double-sided metal keychains, sipper bottles, tumblers, acrylic photo sheets and LED frames. Choose one gift or use the quantity pricing for return gifts, team gifts and customer gifting.</p>
        <h3>How do I personalise and order a gift?</h3>
        <p>Choose a product and quantity, select “Personalise &amp; add to order”, then upload your photo or logo. Use portrait or landscape orientation, image size and position controls, and rotate the 360° mockup to review your design. For double-sided metal keychains, use the same photo on both sides or upload a different photo for each side.</p>
        <h3>What happens when I submit my order?</h3>
        <p>Review your selected items, add your required date and choose pickup or delivery. “Submit order” opens PurelyJid on WhatsApp with your item details and links to uploaded photos and four-view mockups, if added. Tap Send in WhatsApp to share your order.</p>
        <h3>Where is PurelyJid located?</h3>
        <p>Our studio is at Shop no. 2, beside Preet Villa, Jawalkar Nagar, Pimple Gurav, Pune 411027. For delivery, charges depend on weight and distance; the PurelyJid team will inform you of the charges before dispatch.</p>
        <p>Explore our <a href="/vinylfonts">custom vinyl lettering</a> for your creative projects, or <a href="https://www.pjresin.in/">shop resin art and craft supplies</a>.</p>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
