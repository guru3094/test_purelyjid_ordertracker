import Link from "next/link";
import BrandLogo from "@/components/branding/BrandLogo";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-grid">
        <div>
          <BrandLogo href="/" />
          <p>Handcrafted resin art, made with love in Pune.</p>
		  <p>Monday: Closed</p>
		  <p>Phone Number: +919518770073</p> 
		  <p>Store Location:</p>
		  <p>PurelyJid, Shop no.2, Sudarshan Chowk, Beside Preet Villa, Jawalkar Nagar, Pimple Gurav - 411027</p>
        </div>
        <div className="footer-links">
          <Link href="/our-story">Our Story</Link>
          <Link href="/shipping">Shipping</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/Terms & Conditions">Terms</Link>
        </div>
        <div className="footer-links">
          <a href="https://www.instagram.com/purely_jid/" target="_blank" rel="noreferrer">Instagram</a>
          <a href="https://wa.me/919518770073" target="_blank" rel="noreferrer">WhatsApp</a>
          <Link href="/track-order">Track Order</Link>
        </div>
      </div>
      <div className="site-shell copyright">© {new Date().getFullYear()} PurelyJid. All rights reserved.</div>
    </footer>
  );
}
