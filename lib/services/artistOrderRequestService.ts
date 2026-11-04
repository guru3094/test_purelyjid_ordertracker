import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { artistProductName } from "@/lib/artist/product-review";
import { appendArtistOrder, updateArtistOrder } from "@/lib/google/artistSheet";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY_KEY;
  if (!url || !key) throw new Error("Supabase service credentials are not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type ArtistDetailsInput = {
  requirements?: unknown;
  artistCost?: unknown;
  artistAdvance?: unknown;
  estimatedDeliveryDate?: unknown;
  comments?: unknown;
};

export async function saveArtistOrderRequest(args: {
  orderId: string; orderDate: string; customerName: string; productName: string; artistDetails?: ArtistDetailsInput;
}) {
  const details = args.artistDetails;
  if (!details) return;
  const artistCost = Number(details.artistCost ?? 0);
  const artistAdvance = Number(details.artistAdvance ?? 0);
  if (!Number.isFinite(artistCost) || artistCost < 0) throw new Error("Artist cost must be zero or greater.");
  if (!Number.isFinite(artistAdvance) || artistAdvance < 0 || artistAdvance > artistCost) throw new Error("Artist advance must be between ₹0 and artist cost.");
  const payload = {
    order_id: args.orderId,
    order_date: args.orderDate,
    customer_name: args.customerName,
    product_name: args.productName,
    artist_sheet_needs_update: true,
    requirements: String(details.requirements ?? "").trim(),
    artist_cost: artistCost,
    artist_advance: artistAdvance,
    artist_balance: artistCost - artistAdvance,
    estimated_delivery_date: String(details.estimatedDeliveryDate ?? "").trim(),
    comments: String(details.comments ?? "").trim(),
    artist_status: "NOT_SENT",
    updated_at: new Date().toISOString(),
  };
  const { error } = await db().from("artist_order_requests").upsert(payload, { onConflict: "order_id" });
  if (error) throw new Error(`Could not save Artist details: ${error.message}`);
}

export async function createArtistAcceptanceLink(orderId: string, options: { productNameOverride?: unknown } = {}) {
  const client = db();
  const { data: order, error } = await client.from("artist_order_requests").select("*").eq("order_id", orderId).single();
  if (error || !order) throw new Error("Artist details were not found for this order.");
  if (order.artist_status === "SENT") {
    const expires = Date.parse(order.acceptance_token_expires_at ?? "");
    if (!order.acceptance_token_hash || (Number.isFinite(expires) && expires > Date.now())) {
      throw new Error("An Artist acceptance link is already active. Send another after it expires or the Artist accepts.");
    }
  }

  const productName = artistProductName(order.product_name, options.productNameOverride);
  const sheetProductName = order.artist_sheet_product_name || (order.artist_sheet_updated ? order.product_name : null);
  const needsSheetUpdate = Boolean(order.artist_sheet_needs_update || productName !== order.product_name);

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const { error: updateError } = await client.from("artist_order_requests").update({
    product_name: productName,
    artist_sheet_product_name: sheetProductName,
    artist_sheet_needs_update: needsSheetUpdate,
    acceptance_token_hash: tokenHash,
    acceptance_token_expires_at: expiresAt,
    artist_status: "SENT",
    accepted_at: null,
    whatsapp_sent_at: now,
    updated_at: now,
  }).eq("order_id", orderId);
  if (updateError) throw new Error(`Could not prepare Artist acceptance link: ${updateError.message}`);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://purelyjid.in").replace(/\/$/, "");
  return { order: { ...order, product_name: productName }, acceptanceUrl: `${appUrl}/artist/respond/${token}`, expiresAt };
}

export async function getArtistRequestByToken(token: string) {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  const { data, error } = await db().from("artist_order_requests").select("*").eq("acceptance_token_hash", hashToken(token)).maybeSingle();
  if (error || !data) return null;
  if (!data.acceptance_token_expires_at || new Date(data.acceptance_token_expires_at).getTime() < Date.now()) return null;
  return data;
}

export async function acceptArtistRequest(token: string) {
  const client = db();
  const tokenHash = hashToken(token);
  const order = await getArtistRequestByToken(token);
  if (!order) throw new Error("This acceptance link is invalid or has expired.");
  artistProductName(order.product_name);
  // Claim this one-time token before the Sheet write. Only one request can claim it.
  const { data: claimed, error: claimError } = await client
    .from("artist_order_requests")
    .update({ acceptance_token_hash: null, acceptance_token_expires_at: null, updated_at: new Date().toISOString() })
    .eq("order_id", order.order_id)
    .eq("acceptance_token_hash", tokenHash)
    .select("order_id")
    .maybeSingle();

  if (claimError) throw new Error(`Could not validate acceptance: ${claimError.message}`);
  if (!claimed) {
    const { data: latest } = await client.from("artist_order_requests").select("*").eq("order_id", order.order_id).single();
    if (latest?.artist_status === "ACCEPTED") return { order: latest, duplicate: true };
    throw new Error("This acceptance link has already been used.");
  }

  // A fresh link can confirm an already accepted order. Record the new response
  // (so it can notify staff) without appending the same order to the Sheet again.
  if (order.artist_sheet_updated) {
    try {
      if (order.artist_sheet_needs_update) await updateArtistOrder(order, order.artist_sheet_product_name || order.product_name);
    } catch (error) {
      await client.from("artist_order_requests").update({ acceptance_token_hash: tokenHash, acceptance_token_expires_at: order.acceptance_token_expires_at }).eq("order_id", order.order_id).is("acceptance_token_hash", null);
      throw error;
    }
    const now = new Date().toISOString();
    const { error } = await client.from("artist_order_requests").update({
      artist_status: "ACCEPTED",
      artist_sheet_needs_update: false,
      artist_sheet_product_name: order.product_name,
      accepted_at: now,
      updated_at: now,
    }).eq("order_id", order.order_id);
    if (error) {
      await client.from("artist_order_requests").update({
        acceptance_token_hash: tokenHash,
        acceptance_token_expires_at: order.acceptance_token_expires_at,
        updated_at: new Date().toISOString(),
      }).eq("order_id", order.order_id).is("acceptance_token_hash", null);
      throw new Error(`Could not save Artist acceptance: ${error.message}`);
    }
    return { order, duplicate: false };
  }

  try {
    await appendArtistOrder(order);
  } catch (error) {
    // Restore the token so the artist can retry if Google Sheets was temporarily unavailable.
    await client.from("artist_order_requests").update({
      acceptance_token_hash: tokenHash,
      acceptance_token_expires_at: order.acceptance_token_expires_at,
      updated_at: new Date().toISOString(),
    }).eq("order_id", order.order_id).is("acceptance_token_hash", null);
    throw error;
  }

  const now = new Date().toISOString();
  const { error } = await client.from("artist_order_requests").update({
    artist_status: "ACCEPTED",
    accepted_at: now,
    artist_sheet_updated: true,
    artist_sheet_needs_update: false,
    artist_sheet_product_name: order.product_name,
    artist_sheet_updated_at: now,
    updated_at: now,
  }).eq("order_id", order.order_id);
  if (error) throw new Error(`Artist Sheet was updated but acceptance status could not be saved: ${error.message}`);
  return { order, duplicate: false };
}
