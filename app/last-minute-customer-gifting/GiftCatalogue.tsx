"use client";

import { useRef, useState } from "react";
import { products, unitPrice } from "./products";
import type { KeychainShape, KeychainFinish } from "./MockupScene";
import GiftMockup, { type GiftMockupHandle } from "./GiftMockup";

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const categories = ["All gifts", "Keychains", "Drinkware", "Photo gifts", "Cards"];

export default function GiftCatalogue() {
  const [keychainShape,setKeychainShape]=useState<KeychainShape>("circle");
  const [keychainFinish,setKeychainFinish]=useState<KeychainFinish>("silver");
  const mockups=useRef(new Map<string,GiftMockupHandle>());
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const [variants,setVariants]=useState<Record<string,string>>({});
  const [sharing,setSharing]=useState(false);
  const [shareNote,setShareNote]=useState("");
  const [category, setCategory] = useState("All gifts");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string>(products[0].id);
  const [personalisation, setPersonalisation] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [fulfilment, setFulfilment] = useState("Pickup");
  const variant=variants[selected]??"";
  const setVariant=(value:string)=>setVariants(current=>({...current,[selected]:value}));
  const selectProduct=(id:string)=>{setSelected(id);setSelectedIds(current=>current.includes(id)?current:[...current,id]);};
  const product = products.find(item => item.id === selected)!;
  const orderedProducts=products.filter(item=>selectedIds.includes(item.id));
  const valid=orderedProducts.length>0&&orderedProducts.every(item=>{const q=Number(quantities[item.id]??item.tiers[0].min);return Number.isSafeInteger(q)&&q>=item.tiers[0].min;});
  const total=orderedProducts.reduce((sum,item)=>{const q=Number(quantities[item.id]??item.tiers[0].min);return sum+(unitPrice(item.tiers,q)??0)*q;},0);
  const message=["Hi PurelyJid! I would like to place an order.",...orderedProducts.flatMap((item,index)=>{
    const q=Number(quantities[item.id]??item.tiers[0].min),rate=unitPrice(item.tiers,q)??0;
    return ["",`${index+1}. ${item.name} (${item.detail})`,item.id==="metal-keychain"?`Shape / finish: ${keychainShape}, ${keychainFinish}`:"",variants[item.id]?`Variant / size: ${variants[item.id]}`:"",`Quantity: ${q}`,`Price per piece: ${money(rate)}`,`Item total: ${money(rate*q)}`].filter(Boolean);
  }),"",`Product total: ${money(total)}`,personalisation&&`Personalisation / notes: ${personalisation}`,requiredDate&&`Required date: ${requiredDate}`,`Fulfilment: ${fulfilment}`].filter(Boolean).join("\n");

  async function submitOrder(){
    if(!valid)return;
    setSharing(true);setShareNote("");
    try{
      const attachments:string[]=[];
      for(const item of orderedProducts){
        const files=await mockups.current.get(item.id)?.getFiles()??[];
        if(!files.length)continue;
        const prepared=await fetch("/api/gifting-artwork",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({files:files.map(file=>({type:file.type,size:file.size}))})});
        const body=await prepared.json();
        if(!prepared.ok||!Array.isArray(body.uploads)||body.uploads.length!==files.length)throw new Error(body.error??"Could not prepare image links.");
        for(let i=0;i<files.length;i++){
          const form=new FormData();form.append("cacheControl","3600");form.append("",files[i]);
          const upload=await fetch(body.uploads[i].uploadUrl,{method:"PUT",body:form,headers:{"x-upsert":"false"}});
          if(!upload.ok)throw new Error("Image upload failed. Please try submitting again.");
          const label=files[i].name.includes("four-view-mockup")?"Four-view mockup":files[i].name.startsWith("back-")?"Back photo":"Original / front photo";
          attachments.push(`${item.name} — ${label}: ${body.uploads[i].url}`);
        }
      }
      const text=message+(attachments.length?"\n\nPhotos and mockups (links valid for 30 days):\n"+attachments.join("\n"):"");
      window.location.assign(`https://wa.me/919518770073?text=${encodeURIComponent(text)}`);
    }catch(error){setShareNote(error instanceof Error?error.message:"Could not submit your order. Please try again.");}
    finally{setSharing(false);}
  }
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
        <label className="gift-order-check"><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={event=>{if(event.target.checked)selectProduct(item.id);else setSelectedIds(current=>current.filter(id=>id!==item.id));}} />Include in order</label>
        <a className="gift-select" href="#gift-enquiry" onClick={() => selectProduct(item.id)}>Personalise & add to order <span aria-hidden="true">↗</span></a>
      </article>;
    })}</div>
    <section id="gift-enquiry" className="gift-enquiry">
      <div><p className="vinyl-eyebrow">MAKE IT YOURS</p><h2>A personal touch,<br />a memorable gift.</h2><p>Add your requirements and share your selection with PurelyJid on WhatsApp.</p></div>
      <div>{products.filter(item=>selectedIds.includes(item.id)||item.id===selected).map(item=><div key={item.id} className={item.id===selected?undefined:"gift-inactive-editor"} aria-hidden={item.id!==selected} inert={item.id!==selected}><GiftMockup ref={handle=>{if(handle)mockups.current.set(item.id,handle);else mockups.current.delete(item.id);}} productId={item.id} name={item.name} detail={item.detail} keychainShape={keychainShape} keychainFinish={keychainFinish} onKeychainShapeChange={setKeychainShape} onKeychainFinishChange={setKeychainFinish} isActive={item.id===selected} /></div>)}<form onSubmit={event=>{event.preventDefault();void submitOrder();}}>
        <label>Personalise gift<select value={selected} onChange={event => {selectProduct(event.target.value);}}>{products.map(item => <option key={item.id} value={item.id}>{item.name} — {item.detail}</option>)}</select></label>
        <div className="gift-form-row"><label>Quantity<input type="number" required min={product.tiers[0].min} step="1" value={quantities[product.id] ?? product.tiers[0].min} onChange={event => setQuantities({...quantities, [product.id]: event.target.value})} /></label><label>Required date<input type="date" value={requiredDate} onChange={event => setRequiredDate(event.target.value)} /></label></div>
        <label>Variant / size (optional)<input value={variant} onChange={event => setVariant(event.target.value)} placeholder="e.g. heart frame or 600 ml bottle" /></label>
        <label>Personalisation (optional)<textarea rows={3} value={personalisation} onChange={event => setPersonalisation(event.target.value)} placeholder="Name, message, logo or photo requirements. Share artwork in WhatsApp." /></label>
        <label>Fulfilment<select value={fulfilment} onChange={event => setFulfilment(event.target.value)}><option>Pickup</option><option>Delivery</option></select></label>
        {fulfilment === "Delivery" && <p className="gift-delivery-note">Delivery charges will be applicable based on weight and distance and PurelyJid team will inform the charges prior to dispatch.</p>}
        <div className="gift-order-items" aria-live="polite"><strong>Selected items ({orderedProducts.length})</strong>{orderedProducts.length?orderedProducts.map(item=>{const q=Number(quantities[item.id]??item.tiers[0].min);return <div key={item.id}><span>{item.name} · {item.detail} × {q}</span><strong>{money((unitPrice(item.tiers,q)??0)*q)}</strong></div>}):<p>Choose “Include in order” on the gifts you want.</p>}</div>
        <div className="gift-summary"><span>Product total</span><strong>{money(Number.isFinite(total)?total:0)}</strong></div>
        <p className="gift-delivery-note">Submit order opens PurelyJid on WhatsApp with your selected items and photo/mockup links. Tap Send in WhatsApp to send the order.</p>
        {shareNote&&<p role="alert" className="gift-validation">{shareNote}</p>}
        <button className="gift-whatsapp" type="submit" disabled={!valid||sharing}>{sharing?"Preparing your order…":"Submit order"}</button>
      </form></div>
    </section>
  </section>;
}
