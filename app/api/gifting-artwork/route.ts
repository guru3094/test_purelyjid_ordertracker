import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { artworkStorage } from "@/lib/vinyl/artwork";
import { GIFT_BUCKET, MAX_GIFT_BYTES, LINK_LIFETIME_SECONDS, ensureGiftBucket, giftToken, giftTypes } from "@/lib/gifting/artwork";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
  try{
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
    const body=await request.json();
    if(!Array.isArray(body.files)||body.files.length<1||body.files.length>3||body.files.some((file:{type:string;size:number})=>!file||!Object.hasOwn(giftTypes,file.type)||!Number.isSafeInteger(file.size)||file.size<1||file.size>MAX_GIFT_BYTES))return NextResponse.json({error:"Choose up to three PNG, JPG or WebP images, at most 10 MB each."},{status:400});
    await ensureGiftBucket();
    const expires=Math.floor(Date.now()/1000)+LINK_LIFETIME_SECONDS;
    const uploads=[];
    for(const file of body.files){
      const id=`${randomUUID()}.${giftTypes[file.type as keyof typeof giftTypes]}`;
      const {data,error}=await artworkStorage().from(GIFT_BUCKET).createSignedUploadUrl(id,{upsert:false});
      if(error||!data)throw error??new Error("Could not prepare upload.");
      const download=new URL(`/api/gifting-artwork/${id}`,request.nextUrl.origin);
      download.searchParams.set("expires",String(expires));download.searchParams.set("token",giftToken(id,expires));
      uploads.push({uploadUrl:data.signedUrl,url:download.toString()});
    }
    return NextResponse.json({uploads},{headers:{"Cache-Control":"no-store"}});
  }catch(error){console.error("Gifting artwork upload preparation failed",error);return NextResponse.json({error:"Could not prepare image links. Please try again."},{status:500});}
}
