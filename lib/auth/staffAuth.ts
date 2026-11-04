import crypto from "crypto";
import { cookies } from "next/headers";

export const STAFF_SESSION_COOKIE = "pj_staff_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function getSecret(): string {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("STAFF_SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createStaffSession(username: string): string {
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Date.now() + MAX_AGE_SECONDS * 1000,
    nonce: crypto.randomBytes(16).toString("hex"),
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyStaffSession(token?: string): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(payload);
  try {
    const actualBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(data.expiresAt) > Date.now();
  } catch {
    return false;
  }
}

export async function isStaffAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyStaffSession(cookieStore.get(STAFF_SESSION_COOKIE)?.value);
}

export const staffCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
