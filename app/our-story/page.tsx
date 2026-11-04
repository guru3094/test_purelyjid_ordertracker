import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story",

  description:
    "Learn the story behind PurelyJid and our passion for handmade resin art.",

  alternates: {
    canonical: "/our-story",
  },
};

import Image from "next/image";
import SiteHeader from "@/components/homepage/SiteHeader";
import SiteFooter from "@/components/homepage/SiteFooter";

export default function OurStoryPage() {
  return <main className="home-page"><SiteHeader /><section className="page-hero"><div className="site-shell"><p className="kicker">Our Story</p><h1>Made by hand. Made to hold meaning.</h1></div></section><section className="site-shell content-page story-detail"><div className="story-image-wrap"><Image src="/story.png" alt="Hand-pouring resin art" fill sizes="(max-width: 900px) 100vw, 50vw" /></div><div><h2>PurelyJid began with a love for preserving memories.</h2><p>Founded in Pune, PurelyJid creates handcrafted resin art, personalised keepsakes, wedding preservation frames, home décor and creative DIY experiences.</p><p>Each piece is planned, poured, polished and packed with individual attention. Because resin moves naturally, every final creation has its own character — no two pieces are exactly alike.</p><p>From a wedding varmala to a thoughtful custom gift, our aim is to transform meaningful moments into objects you can keep close for years.</p><a className="button button-dark" href="https://wa.me/919518770073" target="_blank" rel="noreferrer">Talk to us on WhatsApp</a></div></section><SiteFooter /></main>;
}
