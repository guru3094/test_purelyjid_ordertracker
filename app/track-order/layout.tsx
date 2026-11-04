import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order",

  description:
    "Track your PurelyJid order using your Order ID and registered mobile number.",

  alternates: {
    canonical: "/track-order",
  },

  openGraph: {
    title: "Track Your PurelyJid Order",

    description:
      "Check the current status of your PurelyJid order online.",

    url: "https://purelyjid.in/track-order",
  },
};

export default function TrackOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
