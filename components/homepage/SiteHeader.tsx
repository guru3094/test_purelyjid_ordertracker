"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header studio-header">
      <div className="site-announcement">PUNE MADE · CRAFTED WITH PURPOSE <span>Personal pieces for the moments that matter.</span></div>
      <div className="site-shell header-inner">
        <Link className="studio-brand" href="/" aria-label="PurelyJid home">
          <span className="studio-brand-mark">
            <Image src="/purelyjid-logo.png" alt="" width={72} height={72} priority sizes="(max-width: 620px) 48px, 64px" />
          </span>
          <span className="studio-brand-copy">
            <span className="studio-brand-name">Purely<span>Jid</span></span>
            <span className="studio-brand-services">Resin Art <i aria-hidden="true">·</i> Supplies <i aria-hidden="true">·</i> Workshops</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/#collections">Collections</Link>

          <Link href="/resin-art-consultation">
            Consultation
          </Link>

          <Link href="/our-story">Our Story</Link>

          <Link href="/vinylfonts">Custom Vinyls</Link>

          <a
            href="https://www.instagram.com/purely_jid/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>

          <Link className="track-link" href="/track-order">
            Track Order
          </Link>
        </nav>

        <div className="mobile-header-actions">
          <Link className="mobile-track-link" href="/track-order">
            Track Order
          </Link>

          <button
            type="button"
            className={`mobile-menu-button ${
              menuOpen ? "mobile-menu-button-open" : ""
            }`}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <nav
        className={`mobile-nav ${
          menuOpen ? "mobile-nav-open" : ""
        }`}
        aria-label="Mobile navigation"
      >
        <Link href="/#collections" onClick={closeMenu}>
          Collections
        </Link>

        <Link
          href="/resin-art-consultation"
          onClick={closeMenu}
        >
          Resin Art Consultation
        </Link>

        <Link href="/our-story" onClick={closeMenu}>
          Our Story
        </Link>

        <Link href="/vinylfonts" onClick={closeMenu}>
          Custom Vinyls
        </Link>

        <a
          href="https://www.instagram.com/purely_jid/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={closeMenu}
        >
          Instagram
        </a>
      </nav>
    </header>
  );
}
