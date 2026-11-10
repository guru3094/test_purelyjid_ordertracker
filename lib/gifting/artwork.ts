import { createHmac, timingSafeEqual } from "node:crypto";
export const MAX_GIFT_BYTES=10*1024*1024;
export const LINK_LIFETIME_SECONDS=30*24*60*60;
export const giftTypes={"image/png":"png","image/jpeg":"jpg","image/webp":"webp"} as const;
export function giftToken(id:string,expires:number){
  const secret=process.env.GIFTING_LINK_SECRET ?? process.env.STAFF_SESSION_SECRET;
  if(!secret||secret.length<32)throw new Error("Artwork links require the server session secret.");
  return createHmac("sha256",secret).update(`gifting:${id}:${expires}`).digest("hex");
}
export function validGiftLink(id:string,expires:number,token:string,now=Math.floor(Date.now()/1000)){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|webp)$/.test(id)||!Number.isSafeInteger(expires)||expires<=now||expires>now+LINK_LIFETIME_SECONDS+60||!/^[0-9a-f]{64}$/.test(token))return false;
  return timingSafeEqual(Buffer.from(token,"hex"),Buffer.from(giftToken(id,expires),"hex"));
}
