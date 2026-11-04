import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ARTWORK_BUCKET, MAX_ARTWORK_BYTES, artworkPath, artworkStorage, artworkToken, artworkType, ensureArtworkBucket } from "@/lib/vinyl/artwork";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_ARTWORK_BYTES) {
      return NextResponse.json({ error: "Upload a PNG or JPG/JPEG under 5 MB." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = artworkType(bytes);
    if (!contentType || !["image/png", "image/jpeg"].includes(file.type)) {
      return NextResponse.json({ error: "The file must contain a valid PNG or JPG/JPEG image." }, { status: 400 });
    }
    await ensureArtworkBucket();
    const id = randomUUID();
    const path = artworkPath(id, contentType === "image/png" ? "png" : "jpg");
    const { error } = await artworkStorage().from(ARTWORK_BUCKET).upload(path, bytes, {
      contentType, upsert: false, cacheControl: "3600",
    });
    if (error) throw error;
    const url = new URL(`/api/vinyl-artwork/${id}`, request.url);
    url.searchParams.set("token", artworkToken(id));
    return NextResponse.json({ url: url.toString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Vinyl artwork upload failed:", error);
    return NextResponse.json({ error: "Could not save the image. Check Supabase Storage and try again." }, { status: 500 });
  }
}
