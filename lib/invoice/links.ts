import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type InvoiceMode = "invoice" | "advance";
export type InvoiceSnapshot = {
  orderId: string;
  orderDate: string;
  customerName: string;
  fulfillmentMethod: string;
  mode: InvoiceMode;
  advancePaid: number;
  productName?: string;
  productCost?: number;
  balance?: number;
};
type InvoiceClaim = InvoiceSnapshot & { expiresAt: number };
const LINK_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

function key() {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("STAFF_SESSION_SECRET must be at least 32 characters for invoice links.");
  return createHash("sha256").update("purelyjid-invoice-v1:").update(secret).digest();
}

export function createInvoiceLink(snapshot: InvoiceSnapshot): string {
  // An encrypted snapshot keeps the WhatsApp text and PDF consistent if the
  // underlying Google Sheet changes later. No customer data is exposed in the URL.
  const claim: InvoiceClaim = { ...snapshot, expiresAt: Date.now() + LINK_LIFETIME_MS };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(claim), "utf8"), cipher.final()]);
  const token = [iv, encrypted, cipher.getAuthTag()].map(part => part.toString("base64url")).join(".");
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.purelyjid.in";
  const url = new URL("/api/customer-invoice", base);
  url.searchParams.set("token", token);
  return url.toString();
}

export function verifyInvoiceToken(token: string | null): InvoiceSnapshot | null {
  if (!token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) || token.length > 3000) return null;
  try {
    const [encodedIv, encodedData, encodedTag] = token.split(".");
    const iv = Buffer.from(encodedIv, "base64url"), tag = Buffer.from(encodedTag, "base64url");
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const claim = JSON.parse(Buffer.concat([decipher.update(Buffer.from(encodedData, "base64url")), decipher.final()]).toString("utf8")) as InvoiceClaim;
    if (typeof claim.orderId !== "string" || !/^[A-Za-z0-9_-]{3,40}$/.test(claim.orderId) ||
        typeof claim.customerName !== "string" || typeof claim.orderDate !== "string" ||
        typeof claim.fulfillmentMethod !== "string" ||
        !["invoice", "advance"].includes(claim.mode) ||
        !Number.isFinite(claim.advancePaid) || claim.advancePaid < 0 ||
        !Number.isFinite(claim.expiresAt) || claim.expiresAt <= Date.now() ||
        claim.expiresAt > Date.now() + LINK_LIFETIME_MS) return null;
    if (claim.mode === "invoice" && (!claim.productName?.trim() || !Number.isFinite(claim.productCost) || !Number.isFinite(claim.balance))) return null;
    return claim;
  } catch { return null; }
}
