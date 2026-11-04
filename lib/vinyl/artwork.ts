import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const ARTWORK_BUCKET = "vinyl-customer-artwork";
export const MAX_ARTWORK_BYTES = 5 * 1024 * 1024;

export function artworkStorage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Artwork storage requires Supabase server credentials.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage;
}

export function artworkToken(id: string) {
  const secret = process.env.STAFF_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Set STAFF_SESSION_SECRET to at least 32 characters before accepting artwork.");
  return createHmac("sha256", secret).update(`vinyl-artwork:${id}`).digest("hex");
}

export function validArtworkToken(id: string, token: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) return false;
  return timingSafeEqual(Buffer.from(artworkToken(id), "hex"), Buffer.from(token, "hex"));
}

export function artworkType(bytes: Uint8Array): "image/png" | "image/jpeg" | null {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  return null;
}

export function artworkPath(id: string, kind: "png" | "jpg") { return `${id}.${kind}`; }

export async function ensureArtworkBucket() {
  const storage = artworkStorage();
  const { data, error } = await storage.getBucket(ARTWORK_BUCKET);
  if (data) return;
  if (error && !/not found/i.test(error.message) && error.statusCode !== "404") throw error;
  const created = await storage.createBucket(ARTWORK_BUCKET, {
    public: false, fileSizeLimit: `${MAX_ARTWORK_BYTES}`, allowedMimeTypes: ["image/png", "image/jpeg"],
  });
  if (created.error && !/already exists/i.test(created.error.message)) throw created.error;
}
