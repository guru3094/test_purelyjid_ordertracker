import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const overrides={}; const cache=new Map();
function load(file){
 if(cache.has(file))return cache.get(file);
 let s=stripTypeScriptTypes(readFileSync(new URL('../'+file,import.meta.url),'utf8'));
 s=s.replace(/from ["']([^"']+)["']/g,(_,d)=>`from ${JSON.stringify(overrides[d] || (d.startsWith('@/')?load(d.slice(2)+'.ts'):d))}`);
 const u=url(s);cache.set(file,u);return u;
}
overrides['next/server']=url('export const NextRequest=Request; export const NextResponse={json:(data,init)=>Response.json(data,init)};');
overrides['@/lib/auth/staffAuth']=url('export const isStaffAuthenticated=async()=>globalThis.fixture.authorized!==false;');
overrides['@/lib/services/staffOrdersCacheService']=url('export const getCachedStaffOrders=async()=>globalThis.fixture.sourceOrders||[];');
overrides['@/lib/canva/vinylFontPreview']=url('export async function generateVinylFontPreviews(content){globalThis.fixture.canvaCalls++;return [{code:"PF01",content}];}');
overrides['@supabase/supabase-js']=url(`export function createClient(){return {from(){let action='read',payload,filters=[];const run=()=>{const f=globalThis.fixture;const row=f.order;if(filters.some(([k,v])=>row?.[k]!==v))return {data:null,error:null};if(action==='update'){f.updates.push({...payload});Object.assign(row,payload);}if(action==='upsert'){f.order={...row,...payload};f.updates.push({...payload});}return {data:f.order?{...f.order}:null,error:null};};return {select(){return this},eq(k,v){filters.push([k,v]);return this},is(k,v){filters.push([k,v]);return this},update(p){action='update';payload=p;return this},upsert(p){action='upsert';payload=p;return this},single:async()=>run(),maybeSingle:async()=>run(),then(resolve,reject){return Promise.resolve(run()).then(resolve,reject)}}}};}`);
overrides['googleapis']=url(`export const google={sheets(){return {spreadsheets:{values:{async append(r){globalThis.fixture.sheetAppend=r;return {data:{}}},async get(){return {data:{values:globalThis.fixture.sheetRows||[]}}},async batchUpdate(r){globalThis.fixture.sheetUpdate=r;return {data:{}}}}}}}};`);
overrides['@/lib/google/auth']=url('export const getGoogleAuth=()=>({});');
overrides['@/lib/invoice/pdf']=url('export async function makeCustomerInvoicePdf(snapshot){globalThis.fixture.invoice=snapshot;}');
overrides['@/lib/invoice/links']=url('export const createInvoiceLink=()=>"https://purelyjid.in/invoice-test";');
const price=await import(load('lib/artist/product-review.ts'));
const preview=await import(load('app/api/vinyl-fonts/preview/route.ts'));
const artistRoute=await import(load('app/api/whatsapp/artist/route.ts'));
const service=await import(load('lib/services/artistOrderRequestService.ts'));
const customerRoute=await import(load('app/api/whatsapp/customer/route.ts'));
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test';
process.env.RESIN_ARTIST_WHATSAPP_NUMBER='919999999999';process.env.RESIN_ARTIST_GOOGLE_SHEET_ID='test-sheet';
const req=body=>new Request('https://purelyjid.in/api/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
function fixture(product='Frame ₹2,500'){
 globalThis.fixture={authorized:true,canvaCalls:0,updates:[],order:{order_id:'PJ100001',product_name:product,order_date:'10/29/2026',customer_name:'Test Customer',artist_status:'NOT_SENT',artist_sheet_updated:false,remarks:'',comments:'Handle carefully'},sourceOrders:[{orderId:'PJ100001',remarks:'Blue background',customerName:'Test Customer',orderDate:'10/29/2026',mobileNumber:'9999999999',productName:'Frame ₹2,500',advancePaid:'100',productCost:'2500',balanceToBePaid:'2400',fulfillmentMethod:'Pickup',productCategory:'Resin Art',status:'PREPARING'}]};return globalThis.fixture;
}
test('font previews have no character-count or width-bracket restriction',async()=>{
 const f=fixture();
 for(const body of [{content:'ABCDE',width:29},{content:'ABCDEF',width:2.5},{content:'ABCDEFGHI',width:3},{content:'ABCDE'}]) assert.equal((await preview.POST(req(body))).status,200);
 assert.equal(f.canvaCalls,4);
 assert.equal((await preview.POST(req({content:''}))).status,400);
 assert.equal(f.canvaCalls,4);
});
test('detect monetary product notation without treating sizes and quantities as prices',()=>{
 for(const name of ['Frame ₹2500','Frame Rs. 500','Frame 500 INR','Frame 500/-','Frame - 2,500','Price: 2500','Frame - 500 (including name)']) assert.equal(price.hasProductPrice(name),true,name);
 for(const name of ['12 x 18 inch Frame','3D flowers','2 keychains, 5 cm','Wedding 29/10/2026','Frame - 12 cm'])assert.equal(price.hasProductPrice(name),false,name);
});
test('priced product triggers editable response without issuing a token or saving a sent request',async()=>{
 const f=fixture();const r=await artistRoute.POST(req({orderId:'PJ100001'}));assert.equal(r.status,409);assert.equal((await r.json()).code,'ARTIST_PRODUCT_REVIEW_REQUIRED');assert.equal(f.updates.length,0);
});
test('reviewed description is used in WhatsApp, token page data and Sheet; artist remarks and prices stay private',async()=>{
 const f=fixture();const r=await artistRoute.POST(req({orderId:'PJ100001',productNameOverride:'12 x 18 inch Frame'}));assert.equal(r.status,200);
 const data=await r.json(),message=new URL(data.whatsappUrl).searchParams.get('text');assert.match(message,/Product: 12 x 18 inch Frame/);assert.doesNotMatch(message,/Remarks:|Blue background|2,500/);assert.doesNotMatch(data.acceptanceUrl,/2,500|2500|Frame|Blue/);
 assert.equal(f.order.product_name,'12 x 18 inch Frame');assert.equal(f.sourceOrders[0].productName,'Frame ₹2,500');
 const token=data.acceptanceUrl.split('/').at(-1);assert.equal((await service.getArtistRequestByToken(token)).product_name,'12 x 18 inch Frame');await service.acceptArtistRequest(token);
 assert.equal(f.sheetAppend.requestBody.values[0][3],'12 x 18 inch Frame');assert.equal(f.sheetAppend.requestBody.values[0][10],'Handle carefully');assert.equal(f.order.artist_status,'ACCEPTED');
});
test('a corrected resend updates the existing sheet row rather than appending a duplicate',async()=>{
 const f=fixture();f.order.artist_status='ACCEPTED';f.order.artist_sheet_updated=true;f.sheetRows=[['Month','Date','Customer','Product'],['Oct','10/29/2026','Test Customer','Frame ₹2,500']];
 const r=await artistRoute.POST(req({orderId:'PJ100001',productNameOverride:'Custom frame'}));const data=await r.json();await service.acceptArtistRequest(data.acceptanceUrl.split('/').at(-1));
 assert.equal(f.sheetAppend,undefined);assert.equal(f.sheetUpdate.requestBody.data[0].values[0][0],'Custom frame');assert.equal(f.order.artist_sheet_needs_update,false);
});
test('ambiguous prior Sheet rows fail safely and restore the acceptance token for retry',async()=>{
 const f=fixture();f.order.artist_status='ACCEPTED';f.order.artist_sheet_updated=true;f.sheetRows=[];
 const r=await artistRoute.POST(req({orderId:'PJ100001',productNameOverride:'Custom frame'}));const token=(await r.json()).acceptanceUrl.split('/').at(-1);
 await assert.rejects(()=>service.acceptArtistRequest(token),/uniquely find/);assert.ok(f.order.acceptance_token_hash);assert.equal(f.sheetAppend,undefined);assert.equal(f.sheetUpdate,undefined);
});
test('customer invoice and advance messages both include remarks; advance still omits order amount and balance',async()=>{
 fixture();for(const decided of [true,false]){const r=await customerRoute.POST(req({orderId:'PJ100001',productDecided:decided}));assert.equal(r.status,200);const message=new URL((await r.json()).whatsappUrl).searchParams.get('text');assert.match(message,/Remarks: Blue background/);if(!decided)assert.doesNotMatch(message,/Order Amount:|Balance:/);}
});
test('legacy tokens cannot accept a product name that still includes a price',async()=>{
 const f=fixture();const token='a'.repeat(64);const {createHash}=await import('node:crypto');f.order.acceptance_token_hash=createHash('sha256').update(token).digest('hex');f.order.acceptance_token_expires_at=new Date(Date.now()+60000).toISOString();
 await assert.rejects(()=>service.acceptArtistRequest(token),/appears to contain a price/);assert.equal(f.updates.length,0);assert.equal(f.sheetAppend,undefined);
});
test('artist endpoint remains staff-only' ,async()=>{fixture().authorized=false;assert.equal((await artistRoute.POST(req({orderId:'PJ100001'}))).status,401);});
