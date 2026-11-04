import type { Metadata } from "next";
import "./globals.css";
import "./premium-ui.css";

const siteUrl = "https://purelyjid.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default:
      "PurelyJid | Resin Art, Raw Materials & Workshops in Pune, India",
    template: "%s | PurelyJid",
  },

  description:
    "PurelyJid is a resin art studio in Pune, India, offering handmade resin art, wedding flower preservation, personalized gifts, premium resin raw materials, DIY kits and resin workshops, with products available across India.",

  keywords: [
    "PurelyJid",
    "Resin Artist Pune",
    "Resin Artist India",
    "Resin Artist in Pune",
    "Resin Artist in India",
    "Resin Art Pune",
    "Resin Art India",
    "Resin Raw Materials Pune",
    "Resin Raw Materials India",
    "Resin Supplies Pune",
    "Resin Supplies India",
    "Epoxy Resin Pune",
    "Epoxy Resin India",
    "Resin Workshop Pune",
    "Resin Workshop India",
    "Resin Classes Pune",
    "Resin Classes India",
    "Handmade Resin Art",
    "Custom Resin Gifts",
    "Personalized Resin Gifts",
    "Wedding Preservation",
    "Varmala Preservation",
    "Wedding Flower Preservation",
    "DIY Resin Kits",
    "DIY Craft Kits",
    "Resin Home Decor",
    "Resin Name Plate",
    "Resin Photo Frame",
    "Handmade Gifts Pune",
    "Handmade Gifts India",
  ],

  authors: [
    {
      name: "PurelyJid",
      url: siteUrl,
    },
  ],

  creator: "PurelyJid",
  publisher: "PurelyJid",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    title:
      "PurelyJid | Resin Art, Supplies & Workshops in Pune, India",

    description:
      "Discover handmade resin art, wedding flower preservation, personalized gifts, premium resin raw materials, DIY kits and resin workshops in Pune, with products available across India.",

    url: siteUrl,
    siteName: "PurelyJid",
    locale: "en_IN",
    type: "website",

    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt:
          "PurelyJid resin art, resin raw materials and resin workshops in Pune, India",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title:
      "PurelyJid | Resin Art, Supplies & Workshops",

    description:
      "Handmade resin art, premium resin supplies, DIY kits, personalized gifts and resin workshops in Pune, serving customers across India.",

    images: ["/opengraph-image.jpg"],
  },

  category: "Shopping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
