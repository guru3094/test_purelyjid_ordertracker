import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_GIFT_BYTES, LINK_LIFETIME_SECONDS, giftToken, giftTypes } from "@/lib/gifting/artwork";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
  try{
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:"Invalid request origin."},{status:403});
    const body=await request.json();
    if(body.type==="blob.generate-client-token"||body.type==="blob.upload-completed"){
      const result=await handleUpload({body:body as HandleUploadBody,request,onBeforeGenerateToken:async pathname=>{
        if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(png|jpg|webp)$/.test(pathname))throw new Error("Invalid image path.");
        return {allowedContentTypes:Object.keys(giftTypes),maximumSizeInBytes:MAX_GIFT_BYTES,addRandomSuffix:false,allowOverwrite:false,validUntil:Date.now()+10*60*1000,ttlDays:31};
      }});
      return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
    }
    if(!Array.isArray(body.files)||body.files.length<1||body.files.length>3||body.files.some((file:{type:string;size:number})=>!file||!Object.hasOwn(giftTypes,file.type)||!Number.isSafeInteger(file.size)||file.size<1||file.size>MAX_GIFT_BYTES))return NextResponse.json({error:"Choose up to three PNG, JPG or WebP images, at most 10 MB each."},{status:400});
    const expires=Math.floor(Date.now()/1000)+LINK_LIFETIME_SECONDS;
    const uploads=[];
    for(const file of body.files){
      const id=`${randomUUID()}.${giftTypes[file.type as keyof typeof giftTypes]}`;
      const download=new URL(`/api/gifting-artwork/${id}`,request.nextUrl.origin);
      download.searchParams.set("expires",String(expires));download.searchParams.set("token",giftToken(id,expires));
      uploads.push({path:id,url:download.toString()});
    }
    return NextResponse.json({uploads},{headers:{"Cache-Control":"no-store"}});
  }catch(error){console.error("Gifting artwork upload preparation failed",error);return NextResponse.json({error:"Could not prepare image links. Please try again."},{status:500});}
}
