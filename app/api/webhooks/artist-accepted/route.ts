import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ArtistRow = {
  order_id?: unknown;
  artist_status?: unknown;
  accepted_at?: unknown;
  product_name?: unknown;
};

type UpdateEvent = {
  type?: unknown;
  schema?: unknown;
  table?: unknown;
  record?: ArtistRow | null;
  old_record?: ArtistRow | null;
};

function authorized(request: NextRequest, secret: string): boolean {
  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // Hash first to keep comparison constant-time even for differently sized inputs.
  return timingSafeEqual(
    createHash("sha256").update(supplied).digest(),
    createHash("sha256").update(expected).digest()
  );
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY_KEY;
  if (!url || !key) throw new Error("Supabase service credentials are not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const secret = process.env.ARTIST_ACCEPTANCE_WEBHOOK_SECRET;
  if (!secret || !authorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: UpdateEvent;
  try {
    event = await request.json() as UpdateEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Supabase sends every UPDATE on the table. Only the transition to ACCEPTED matters.
  const row = event?.record;
  if (
    event?.type !== "UPDATE" || event.schema !== "public" ||
    event.table !== "artist_order_requests" ||
    row?.artist_status !== "ACCEPTED" || event.old_record?.artist_status === "ACCEPTED" ||
    typeof row.order_id !== "string" || !row.order_id ||
    typeof row.accepted_at !== "string" || !Number.isFinite(Date.parse(row.accepted_at))
  ) {
    return NextResponse.json({ skipped: true });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ARTIST_ACCEPTANCE_EMAIL_FROM;
  const to = process.env.ARTIST_ACCEPTANCE_EMAIL_TO;
  if (!apiKey || !from || !to || !emailPattern.test(to)) {
    return NextResponse.json({ error: "Acceptance email is not configured." }, { status: 503 });
  }

  try {
    const client = serviceClient();
    const { data: current, error: readError } = await client
      .from("artist_order_requests")
      .select("order_id,artist_status,accepted_at,product_name")
      .eq("order_id", row.order_id)
      .single();
    if (readError) throw readError;
    if (
      current.artist_status !== "ACCEPTED" ||
      new Date(current.accepted_at).getTime() !== Date.parse(row.accepted_at)
    ) {
      return NextResponse.json({ skipped: true, reason: "Acceptance has changed." });
    }

    const acceptedAt = current.accepted_at as string;
    const now = new Date().toISOString();
    const notifications = client.from("artist_acceptance_email_notifications");
    const { error: insertError } = await notifications.insert({
      order_id: current.order_id,
      accepted_at: acceptedAt,
      status: "SENDING",
      attempted_at: now,
    });

    if (insertError) {
      if (insertError.code !== "23505") throw insertError;
      const { data: previous, error: previousError } = await client
        .from("artist_acceptance_email_notifications")
        .select("status,attempted_at")
        .eq("order_id", current.order_id)
        .eq("accepted_at", acceptedAt)
        .single();
      if (previousError) throw previousError;
      if (previous.status === "SENT" || (
        previous.status === "SENDING" &&
        Date.now() - Date.parse(previous.attempted_at) < 5 * 60_000
      )) {
        return NextResponse.json({ alreadyHandled: true });
      }
      // Reclaim failures or sends interrupted more than five minutes ago.
      const { data: reclaimed, error: reclaimError } = await client
        .from("artist_acceptance_email_notifications")
        .update({ status: "SENDING", attempted_at: now, last_error: null })
        .eq("order_id", current.order_id)
        .eq("accepted_at", acceptedAt)
        .eq("status", previous.status)
        .eq("attempted_at", previous.attempted_at)
        .select("id")
        .maybeSingle();
      if (reclaimError) throw reclaimError;
      if (!reclaimed) return NextResponse.json({ alreadyHandled: true });
    }

    const subject = `Artist accepted PurelyJid order ${current.order_id}`;
    const text = [
      "PurelyJid Artist Acceptance",
      "",
      `Order ID: ${current.order_id}`,
      `Product: ${current.product_name}`,
      `Accepted at: ${new Date(acceptedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`,
      "",
      "The Artist Google Sheet has been updated. You can also see Accepted on the staff Orders page.",
    ].join("\n");
    // Resend deduplicates retries with the same event key for 24 hours.
    const idempotencyKey = `artist-accepted-${createHash("sha256").update(`${current.order_id}:${acceptedAt}`).digest("hex")}`;
    let response: Response;
    try {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ from, to: [to], subject, text }),
        signal: AbortSignal.timeout(12_000),
      });
    } catch (error) {
      await client.from("artist_acceptance_email_notifications")
        .update({ status: "FAILED", last_error: error instanceof Error ? error.message : "Email request failed." })
        .eq("order_id", current.order_id).eq("accepted_at", acceptedAt);
      return NextResponse.json({ error: "Email delivery request failed." }, { status: 502 });
    }

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      await client.from("artist_acceptance_email_notifications")
        .update({ status: "FAILED", last_error: `Resend ${response.status}: ${detail}` })
        .eq("order_id", current.order_id).eq("accepted_at", acceptedAt);
      return NextResponse.json({ error: "Email provider rejected the request." }, { status: 502 });
    }

    const sent = await response.json() as { id?: string };
    const { error: logError } = await client.from("artist_acceptance_email_notifications")
      .update({ status: "SENT", sent_at: new Date().toISOString(), email_to: to, provider_message_id: sent.id ?? null })
      .eq("order_id", current.order_id).eq("accepted_at", acceptedAt);
    if (logError) throw logError;
    return NextResponse.json({ notified: true });
  } catch (error) {
    console.error("Artist acceptance email notification failed:", error);
    return NextResponse.json({ error: "Could not process acceptance notification." }, { status: 500 });
  }
}
