import type { Metadata } from "next";
import SiteHeader from "@/components/homepage/SiteHeader";
import SiteFooter from "@/components/homepage/SiteFooter";

export const metadata: Metadata = {
  title: "Resin Art Consultation",
  description:
    "Book a personalised online resin art consultation with PurelyJid for project guidance, material selection, troubleshooting, techniques and pricing support.",
  alternates: {
    canonical: "/resin-art-consultation",
  },
};

const whatsapp = (plan: string) =>
  `https://wa.me/919518770073?text=${encodeURIComponent(
    `Hi PurelyJid, I would like to book the ${plan}. Please share the available time slots.`
  )}`;

const plans = [
  {
    name: "Quick Query",
    duration: "15 min",
    price: "₹299",
    includes: "One focused question or a specific resin-art issue.",
    label: "Quick guidance",
  },
  {
    name: "Starter Consultation",
    duration: "30 min",
    price: "₹599",
    includes:
      "Beginner guidance, material selection and basic troubleshooting.",
    label: "Best for beginners",
  },
  {
    name: "Standard Consultation",
    duration: "45 min",
    price: "₹999",
    includes:
      "Project guidance, techniques, pricing, resin issues and live Q&A.",
    label: "Most popular",
    featured: true,
  },
  {
    name: "Premium Consultation",
    duration: "60 min",
    price: "₹1,499",
    includes:
      "Detailed one-on-one guidance with personalised recommendations for your project.",
    label: "Complete support",
  },
];

export default function ResinArtConsultationPage() {
  return (
    <main className="home-page consultation-page">
      <SiteHeader />

      <section className="consultation-hero">
        <div className="site-shell consultation-hero-inner">
          <div>
            <p className="kicker">One-on-one online guidance</p>
            <h1>Resin Art Consultation</h1>
            <p>
              Get on call guidance for your resin-art project—from choosing
              the right materials to solving curing, finishing and pricing
              challenges.
            </p>
            <div className="hero-actions">
              <a
                className="button button-dark"
                href={whatsapp("Resin Art Consultation")}
                target="_blank"
                rel="noreferrer"
              >
                Book on WhatsApp
              </a>
              <a
                className="button consultation-pdf-button"
                href="/purelyjid-resin-art-consultation.pdf"
                target="_blank"
                rel="noreferrer"
              >
                View Pricing
              </a>
            </div>
          </div>
          <aside className="consultation-hero-note">
            <span>What you receive</span>
            <strong>Clear, personalised next steps</strong>
            <p>
              Join a focused audio/video call with your questions, project photos or
              material list ready. Recommendations are tailored to your current
              skill level and project.
            </p>
          </aside>
        </div>
      </section>
	  
      <section className="section site-shell consultation-plans-section">
        <p className="kicker">Consultation plans</p>
        <div className="section-heading-row consultation-heading-row">
          <h2>Choose the support you need.</h2>
          <p>
            Each session is conducted online. Select a plan and message us on
            WhatsApp to confirm an available time slot.
          </p>
        </div>

        <div className="consultation-grid">
          {plans.map((plan) => (
            <article
              className={`consultation-card${plan.featured ? " consultation-card-featured" : ""}`}
              key={plan.name}
            >
              <div className="consultation-card-topline">
                <span>{plan.label}</span>
                <b>{plan.duration}</b>
              </div>
              <h3>{plan.name}</h3>
              <div className="consultation-price">{plan.price}</div>
              <p>{plan.includes}</p>
              <a
                href={whatsapp(plan.name)}
                target="_blank"
                rel="noreferrer"
              >
                Book this consultation →
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="consultation-addons-section">
        <div className="site-shell consultation-addons">
          <div>
            <p className="kicker">Optional add-ons</p>
            <h2>Continue the guidance after your call.</h2>
          </div>
          <div className="consultation-addon-list">
            <article>
              <span>7 days</span>
              <div>
                <h3>Follow-up WhatsApp support</h3>
                <p>Continue with project-related questions after the session on whatsapp chat.</p>
              </div>
              <strong>₹499</strong>
            </article>
            <article>
              <span>30 min</span>
              <div>
                <h3>Additional consultation time</h3>
                <p>Add more audio/video time when your project needs deeper discussion.</p>
              </div>
              <strong>₹699</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="consultation-cta">
        <div className="site-shell consultation-cta-inner">
          <div>
            <p className="kicker light">Ready to get started?</p>
            <h2>Bring your resin-art questions. Leave with a clear plan.</h2>
          </div>
          <a
            className="button button-light"
            href={whatsapp("Resin Art Consultation")}
            target="_blank"
            rel="noreferrer"
          >
            Enquire on WhatsApp
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
