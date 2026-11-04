import { NextRequest, NextResponse } from "next/server";
import { generateVinylFontPreviews } from "@/lib/canva/vinylFontPreview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content : "";
    if (!content.trim()) return NextResponse.json({ success: false, error: "Content is required." }, { status: 400 });
    if (content.length > 100) return NextResponse.json({ success: false, error: "Content cannot exceed 100 characters." }, { status: 400 });
    const previews = await generateVinylFontPreviews(content);
    return NextResponse.json({ success: true, previews });
  } catch (error) {
    console.error("Vinyl font preview error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to generate previews." },
      { status: 500 },
    );
  }
}
