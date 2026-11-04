import { NextResponse } from "next/server";
import { createStaffSession, STAFF_SESSION_COOKIE, staffCookieOptions } from "@/lib/auth/staffAuth";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (username !== process.env.STAFF_USERNAME || password !== process.env.STAFF_PASSWORD) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(STAFF_SESSION_COOKIE, createStaffSession(username), staffCookieOptions);
  return response;
}
