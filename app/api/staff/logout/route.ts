import { NextResponse } from "next/server";
import { STAFF_SESSION_COOKIE } from "@/lib/auth/staffAuth";
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
