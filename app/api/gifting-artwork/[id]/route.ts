import { NextRequest, NextResponse } from "next/server";
import { artworkStorage } from "@/lib/vinyl/artwork";
import { GIFT_BUCKET, validGiftLink } from "@/lib/gifting/artwork";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    if(!validGiftLink(id,Number(request.nextUrl.searchParams.get("expires")),request.nextUrl.searchParams.get("token")??""))return NextResponse.json({error:"Image link is invalid or has expired."},{status:404});
    const {data,error}=await artworkStorage().from(GIFT_BUCKET).createSignedUrl(id,60,{download:`purelyjid-${id}`});
    if(error||!data)return NextResponse.json({error:"Image is unavailable."},{status:404});
    const response=NextResponse.redirect(data.signedUrl,302);response.headers.set("Cache-Control","private, no-store");response.headers.set("Referrer-Policy","no-referrer");response.headers.set("X-Robots-Tag","noindex, nofollow");return response;
  }catch(error){console.error("Gifting artwork link failed",error);return NextResponse.json({error:"Could not retrieve this image."},{status:502});}
}
