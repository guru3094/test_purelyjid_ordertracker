import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { validGiftLink } from "@/lib/gifting/artwork";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    if(!validGiftLink(id,Number(request.nextUrl.searchParams.get("expires")),request.nextUrl.searchParams.get("token")??""))return NextResponse.json({error:"Image link is invalid or has expired."},{status:404});
    const file=await get(id,{access:"private",useCache:false});
    if(!file||file.statusCode!==200)return NextResponse.json({error:"Image is unavailable."},{status:404});
    return new NextResponse(file.stream,{headers:{"Content-Type":file.blob.contentType,"Content-Disposition":`attachment; filename="purelyjid-${id}"`,"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow","X-Content-Type-Options":"nosniff"}});
  }catch(error){console.error("Gifting artwork link failed",error);return NextResponse.json({error:"Could not retrieve this image."},{status:502});}
}
