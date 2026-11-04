"use client";
import { FormEvent,useMemo,useState } from "react";
import StaffNav from "../staff-nav";
import CustomerWhatsAppDialog from "../customer-whatsapp-dialog";

const initial={
  customerName:"",mobileNumber:"",email:"",productDetails:"",remarks:"",
  productCost:"",advancePaid:"",fulfillmentMethod:"Pickup",productCategory:"Resin Art"
};

type Created={orderId:string;customerName:string;mobileNumber:string;productDetails:string;productCost:number;advancePaid:number;balance:number;fulfillmentMethod:string};
const money=(n:number)=>n.toLocaleString("en-IN",{maximumFractionDigits:2});

export default function CreateSaleForm(){
 const[form,setForm]=useState(initial);const[loading,setLoading]=useState(false);const[error,setError]=useState("");const[created,setCreated]=useState<Created|null>(null);const[customerWhatsAppOrderId,setCustomerWhatsAppOrderId]=useState<string|null>(null);
 const balance=useMemo(()=>Math.max(0,Number(form.productCost||0)-Number(form.advancePaid||0)),[form.productCost,form.advancePaid]);
 function change(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>){setForm({...form,[e.target.name]:e.target.value});}

 async function submit(e:FormEvent){
  e.preventDefault();setLoading(true);setError("");
  const submitted={...form};
  try{
   const body={
    customerName:submitted.customerName,mobileNumber:submitted.mobileNumber,email:submitted.email,
    productDetails:submitted.productDetails,remarks:submitted.remarks,productCost:submitted.productCost,
    advancePaid:submitted.advancePaid,fulfillmentMethod:submitted.fulfillmentMethod,productCategory:submitted.productCategory
   };
   const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
   const d=await r.json();
   if(r.status===401){window.location.href="/staff-login";return;}
   if(!r.ok){setError(d.error??d.message??"Order creation failed.");return;}
   setCreated({orderId:d.orderId,customerName:submitted.customerName,mobileNumber:submitted.mobileNumber,productDetails:submitted.productDetails,productCost:Number(submitted.productCost),advancePaid:Number(submitted.advancePaid),balance:Number(d.balance),fulfillmentMethod:submitted.fulfillmentMethod});
   setForm(initial);
  }catch{setError("Could not create the order. Please try again.");}finally{setLoading(false);}
 }

 return <div className="sales-shell"><StaffNav/><main className="sales-content"><section className="staff-card"><h1>Create Sale</h1><p>Creates the order in Google Sheets and automatically starts the existing sync to Supabase.</p>
 {created?<div className="staff-order-success"><div className="staff-success">Order <strong>{created.orderId}</strong> created successfully.</div><div className="staff-order-summary"><p><strong>Customer:</strong> {created.customerName}</p><p><strong>Order Amount:</strong> ₹{money(created.productCost)}</p><p><strong>Advance Paid:</strong> ₹{money(created.advancePaid)}</p><p><strong>Balance:</strong> ₹{money(created.balance)}</p><p><strong>Fulfilment:</strong> {created.fulfillmentMethod}</p></div>
 <div className="staff-success-actions"><button type="button" onClick={()=>setCustomerWhatsAppOrderId(created.orderId)}>WhatsApp Customer</button><button type="button" className="staff-secondary" onClick={()=>{setCreated(null);setError("");}}>Create Another Order</button></div>{error&&<div className="staff-error">{error}</div>}</div>:
 <form onSubmit={submit} className="staff-grid">
 <label>Customer Name *<input name="customerName" value={form.customerName} onChange={change} required/></label>
 <label>Mobile Number *<input name="mobileNumber" inputMode="numeric" maxLength={10} value={form.mobileNumber} onChange={change} required/></label>
 <label>Email<input name="email" type="email" value={form.email} onChange={change}/></label>
 <label>Product Category *<select name="productCategory" value={form.productCategory} onChange={change}><option>Resin Art</option><option>Workshop</option><option>Raw Materials</option></select></label>
 <label className="staff-full">Product / Order Details *<textarea name="productDetails" rows={4} value={form.productDetails} onChange={change} required/></label>
 <label className="staff-full">Remarks<textarea name="remarks" rows={3} value={form.remarks} onChange={change} placeholder="Optional remarks for this order"/></label>
 <label>Product Cost (₹) *<input name="productCost" type="number" min="1" step="0.01" value={form.productCost} onChange={change} required/></label>
 <label>Advance Paid (₹) *<input name="advancePaid" type="number" min="0" step="0.01" value={form.advancePaid} onChange={change} required/></label>
 <label>Balance (₹)<input value={balance} readOnly/></label>
 <label>Fulfilment Method *<select name="fulfillmentMethod" value={form.fulfillmentMethod} onChange={change}><option>Pickup</option><option>Delivery</option></select></label>
 {error&&<div className="staff-full staff-error">{error}</div>}<div className="staff-full staff-actions"><button disabled={loading}>{loading?"Creating Order...":"Create Order"}</button></div></form>}
 </section></main>{customerWhatsAppOrderId&&<CustomerWhatsAppDialog orderId={customerWhatsAppOrderId} onClose={()=>setCustomerWhatsAppOrderId(null)}/>}</div>;
}
