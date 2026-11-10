"use client";

import { useState } from "react";
import { products, unitPrice } from "./products";
import GiftMockup from "./GiftMockup";

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const categories = ["All gifts", "Keychains", "Drinkware", "Photo gifts", "Cards"];

export default function GiftCatalogue() {
  const [category, setCategory] = useState("All gifts");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string>(products[0].id);
  const [personalisation, setPersonalisation] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [fulfilment, setFulfilment] = useState("Pickup");
  const [variant, setVariant] = useState("");
  const product = products.find(item => item.id === selected)!;
  const quantity = Number(quantities[product.id] ?? product.tiers[0].min);
  const valid = Number.isSafeInteger(quantity) && quantity >= product.tiers[0].min;
  const price = valid ? unitPrice(product.tiers, quantity) : null;
  const message = ["Hi PurelyJid! I would like to enquire about Last Minute Customer Gifting.", `Product: ${product.name} (${product.detail})`, variant && `Variant / size: ${variant}`, `Quantity: ${quantity}`, `Price per piece: ${money(price ?? 0)}`, `Product total: ${money((price ?? 0) * quantity)}`, personalisation && `Personalisation: ${personalisation}`, requiredDate && `Required date: ${requiredDate}`, `Fulfilment: ${fulfilment}`].filter(Boolean).join("\n");

  return <section id="gift-catalogue" className="vinyl-container gift-catalogue">
    <div className="gift-section-heading"><div><p className="vinyl-eyebrow">THE GIFT EDIT</p><h2>Pick a little happiness.</h2></div><p>All prices below are per piece.<br />Your quantity unlocks the applicable price.</p></div>
    <div className="gift-filters" aria-label="Filter gifts">{categories.map(item => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="gift-grid">{products.filter(item => category === "All gifts" || item.category === category).map((item) => {
      const amount = Number(quantities[item.id] ?? item.tiers[0].min);
      const ok = Number.isSafeInteger(amount) && amount >= item.tiers[0].min;
      const each = ok ? unitPrice(item.tiers, amount) : null;
      return <article className="gift-card" key={item.id}>
        <div className="gift-card-top"><span>{item.category}</span><span aria-hidden="true">✦</span></div>
        <h3>{item.name}</h3><p className="gift-detail">{item.detail}</p>
        <div className="gift-from">From <strong>{money(item.tiers[item.tiers.length - 1].price)}</strong> / piece <small>at {item.tiers[item.tiers.length - 1].min}+ pieces</small></div>
        <table><caption className="gift-sr-only">{item.name}, {item.detail} pricing</caption><thead><tr><th scope="col">Quantity</th><th scope="col">Per piece</th></tr></thead><tbody>{item.tiers.map((tier, index) => <tr key={tier.min} className={ok && each === tier.price ? "gift-tier-active" : ""}><td>{tier.min}{index === item.tiers.length - 1 ? "+" : `–${item.tiers[index + 1].min - 1}`} pcs</td><td>{money(tier.price)}</td></tr>)}</tbody></table>
        <div className="gift-card-bottom"><label htmlFor={`qty-${item.id}`}>Quantity<input id={`qty-${item.id}`} type="number" min={item.tiers[0].min} step="1" value={quantities[item.id] ?? item.tiers[0].min} onChange={event => setQuantities({...quantities, [item.id]: event.target.value})} /></label><div aria-live="polite"><span>Product total</span><strong>{each !== null ? money(each * amount) : "—"}</strong></div></div>
        {!ok && <p className="gift-validation">Enter a whole quantity of {item.tiers[0].min} or more.</p>}
        <a className="gift-select" href="#gift-enquiry" onClick={() => {setSelected(item.id); setVariant("");}}>Personalise & enquire <span aria-hidden="true">↗</span></a>
      </article>;
    })}</div>
    <section id="gift-enquiry" className="gift-enquiry">
      <div><p className="vinyl-eyebrow">MAKE IT YOURS</p><h2>A personal touch,<br />a memorable gift.</h2><p>Add your requirements and share your selection with PurelyJid on WhatsApp.</p></div>
      <div><GiftMockup productId={product.id} name={product.name} detail={product.detail} /><form onSubmit={event => {event.preventDefault(); if(valid) window.open(`https://wa.me/919518770073?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");}}>
        <label>Selected gift<select value={selected} onChange={event => {setSelected(event.target.value); setVariant("");}}>{products.map(item => <option key={item.id} value={item.id}>{item.name} — {item.detail}</option>)}</select></label>
        <div className="gift-form-row"><label>Quantity<input type="number" required min={product.tiers[0].min} step="1" value={quantities[product.id] ?? product.tiers[0].min} onChange={event => setQuantities({...quantities, [product.id]: event.target.value})} /></label><label>Required date<input type="date" value={requiredDate} onChange={event => setRequiredDate(event.target.value)} /></label></div>
        <label>Variant / size (optional)<input value={variant} onChange={event => setVariant(event.target.value)} placeholder="e.g. heart frame or 600 ml bottle" /></label>
        <label>Personalisation (optional)<textarea rows={3} value={personalisation} onChange={event => setPersonalisation(event.target.value)} placeholder="Name, message, logo or photo requirements. Share artwork in WhatsApp." /></label>
        <label>Fulfilment<select value={fulfilment} onChange={event => setFulfilment(event.target.value)}><option>Pickup</option><option>Delivery</option></select></label>
        {fulfilment === "Delivery" && <p className="gift-delivery-note">Delivery charges will be applicable based on weight and distance and PurelyJid team will inform the charges prior to dispatch.</p>}
        <div className="gift-summary" aria-live="polite"><span>{valid ? `${quantity} pieces × ${money(price ?? 0)}` : `Minimum ${product.tiers[0].min} pieces`}</span><strong>{price !== null ? money(price * quantity) : "—"}</strong></div>
        <button className="gift-whatsapp" disabled={!valid} type="submit">Enquire on WhatsApp ↗</button>
      </form></div>
    </section>
  </section>;
}
