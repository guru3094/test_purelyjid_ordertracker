import { NextRequest, NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/auth/staffAuth";
import { generateCanvaOutline } from "@/app/cricut_svg/canva-outline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  if (!(await isStaffAuthenticated())) return NextResponse.json({ error: "Staff sign-in required." }, { status: 401 });
  try {
    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const fontCode = typeof body?.fontCode === "string" ? body.fontCode : "";
    if (!content || content.length > 100 || /[\r\n]/.test(content) || !/^PF0[1-8]$/.test(fontCode)) {
      return NextResponse.json({ error: "Enter one line of text (up to 100 characters) and a valid PF font." }, { status: 400 });
    }
    return NextResponse.json(await generateCanvaOutline(content, fontCode), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("Canva Cricut outline generation failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not generate Canva vector outlines." }, { status: 502 });
  }
}
