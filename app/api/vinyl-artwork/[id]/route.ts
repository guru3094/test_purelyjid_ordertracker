import { NextRequest, NextResponse } from "next/server";
import { ARTWORK_BUCKET, artworkPath, artworkStorage, validArtworkToken } from "@/lib/vinyl/artwork";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!/^[0-9a-f-]{36}$/.test(id) || !validArtworkToken(id, token)) {
    return NextResponse.json({ error: "Artwork link is invalid." }, { status: 404 });
  }
  for (const kind of ["png", "jpg"] as const) {
    const { data, error } = await artworkStorage().from(ARTWORK_BUCKET).download(artworkPath(id, kind));
    if (data) return new NextResponse(data, {
      headers: { "Content-Type": kind === "png" ? "image/png" : "image/jpeg", "Content-Disposition": `inline; filename="vinyl-artwork-${id}.${kind}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
    });
    if (error && !/not found|does not exist|object not found/i.test(error.message)) {
      console.error("Artwork download failed:", error);
      return NextResponse.json({ error: "Could not retrieve artwork." }, { status: 502 });
    }
  }
  return NextResponse.json({ error: "Artwork is unavailable." }, { status: 404 });
}
