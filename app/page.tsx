import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/homepage/SiteHeader";
import SiteFooter from "@/components/homepage/SiteFooter";

const whatsapp = (item: string) =>
  `https://wa.me/919518770073?text=${encodeURIComponent(`Hi PurelyJid, I am interested in ${item}. Please share more details.`)}`;

const collections = [
  { title: "Raw Materials For Resin Art", eyebrow: "Shop Now", image: "/Raw-Materials.webp", href: "https://api1.vyaparapp.in/store/purelyjid" },
  { title: "Resin Art Workshops", eyebrow: "New", image: "/workshop.webp", href: whatsapp("Resin Art Workshops") },
  { title: "Key Chains & Bookmarks", eyebrow: "Popular", image: "/Keychain.webp", href: whatsapp("Key Chains & Bookmarks") },
  { title: "Resin Thin Photo Frames", eyebrow: "Gift Idea", image: "/ThinPhotoFrame.webp", href: whatsapp("Resin Thin Photo Frames") },
  { title: "Wooden Preservation Frames", eyebrow: "Trending", image: "/WoodenFrame.webp", href: whatsapp("Wooden Preservation Frames") },
  { title: "Luxury Table Tops", eyebrow: "Trending", image: "/LuxuryTableTop.webp", href: whatsapp("Luxury Table Tops") },
  { title: "Resin Wall Clock Preservation", eyebrow: "Trending", image: "/WallClock.webp", href: whatsapp("Resin Wall Clock Preservation") },
  { title: "3-Partition Frames", eyebrow: "Trending", image: "/PartitionFrame.webp", href: whatsapp("3-Partition Frames") },
  { title: "Baby Birth Keepsake Frames", eyebrow: "Trending", image: "/BabyKeepSake.webp", href: whatsapp("Baby Birth Keepsake Frames") },
];

const reviews = [
  { text: "The final piece was beautiful, meaningful and finished with exceptional attention to detail.", name: "Sumit Jadhav", product: "Resin Wall Clock" },
  { text: "Our wedding garland preservation was handled with care from design discussion to the final frame.", name: "Caroline Joseph", product: "Varmala Frame" },
  { text: "The resin work is clear, neat and professionally finished. We were updated throughout the process.", name: "Siddharth Kolap", product: "Flower Preservation" },
];

export default function HomePage() {
  return (
    <main className="home-page">
      <SiteHeader />

      <section className="hero-section">
        <div className="site-shell hero-content">
          <p className="kicker">Handmade in Pune · Purely yours</p>
          <h1>Moments made <em>to stay.</em></h1>
          <p> Discover handcrafted resin keepsakes, wedding flower preservation, personalised gifts, premium resin raw materials, DIY kits and hands-on resin workshops by PurelyJid.</p>
          <div className="hero-actions">
            <a className="button button-light" href="#collections">Explore Collections</a>
            <Link className="button button-outline" href="/track-order">Track Your Order</Link>
          </div>
          <span className="hero-editorial-note">Wedding keepsakes · Custom gifts · Creative experiences</span>
        </div>
        <div className="hero-image-wrap"><Image src="/hero.jpg" alt="Handcrafted resin art" fill priority sizes="(max-width: 900px) 100vw, 48vw" className="hero-image" /></div>
      </section>

      <section className="stats-strip">
        <div className="site-shell stats-grid">
          <div><strong>2,400+</strong><span>Happy Customers</span></div>
          <div><strong>5.0★</strong><span>Average Rating</span></div>
          <div><strong>180+</strong><span>Unique Designs</span></div>
          <div><strong>100%</strong><span>Handcrafted</span></div>
        </div>
      </section>

      <section id="collections" className="section site-shell">
        <p className="kicker">Our Collections</p>
        <div className="section-heading-row">
          <h2>Crafted for every moment.</h2>
          <p>Choose a collection to enquire on WhatsApp. DIY craft kits open directly on pjresin.in.</p>
        </div>
        <div className="collection-grid">
          {collections.map((item, index) => (
            <a className={`collection-card card-${index + 1}`} href={item.href} target="_blank" rel="noreferrer" key={item.title}>
              <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 100vw, 50vw" />
              <div className="card-shade" />
              <div className="card-content"><span>{item.eyebrow}</span><h3>{item.title}</h3><b>Explore →</b></div>
            </a>
          ))}
        </div>
      </section>

      <section className="story-section">
        <div className="site-shell story-grid">
          <div className="story-image-wrap"><Image src="/story.png" alt="Resin artist creating a handcrafted piece" fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
          <div className="story-copy">
            <p className="kicker">Our Story</p>
            <h2>Art born from pure intention.</h2>
            <p>PurelyJid began in Pune with a simple belief: meaningful moments deserve to be preserved beautifully. Every piece is hand-poured in small batches and created with patience, care and personal attention.</p>
            <div className="feature-list">
              <div><strong>Hand-Poured</strong><span>Made individually, never mass-produced.</span></div>
              <div><strong>Made to Remember</strong><span>Personalised keepsakes that hold your story.</span></div>
              <div><strong>Gift Ready</strong><span>Carefully finished and securely packed.</span></div>
            </div>
            <Link className="text-link" href="/our-story">Read our story →</Link>
          </div>
        </div>
      </section>

      <section className="section site-shell instagram-section">
        <p className="kicker">Instagram</p>
        <h2>Follow our creative journey.</h2>
        <p>Behind the scenes, new designs, custom orders and resin art in the making.</p>
        <div className="instagram-grid">
          {["/Process.webp"].map((src, index) => (
            <a key={src} href="https://www.instagram.com/purely_jid/" target="_blank" rel="noreferrer" aria-label={`View PurelyJid on Instagram ${index + 1}`}>
              <Image src={src} alt="PurelyJid creation" fill sizes="(max-width: 6000px) 60vw, 30vw" />
            </a>
          ))}
        </div>
        <a className="button button-dark" href="https://www.instagram.com/purely_jid/" target="_blank" rel="noreferrer">Follow @purely_jid</a>
      </section>

      <section className="testimonials-section">
        <div className="site-shell section">
          <p className="kicker">What They Say</p><h2>Real people, real joy.</h2>
          <div className="review-grid">{reviews.map((review) => <article key={review.name}><div className="stars">★★★★★</div><p>“{review.text}”</p><strong>{review.name}</strong><span>{review.product}</span></article>)}</div>
        </div>
      </section>

      <section className="track-cta">
        <div className="site-shell track-cta-inner"><div><p className="kicker light">Already placed an order?</p><h2>Track its journey in seconds.</h2><p>Use your order ID and registered mobile number to view the latest status.</p></div><Link className="button button-light" href="/track-order">Track Order</Link></div>
      </section>

      <SiteFooter />
    </main>
  );
}
