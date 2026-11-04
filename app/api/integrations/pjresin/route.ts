import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { validSignature } from "@/lib/security/request-signature";
import { supabase } from "@/lib/supabase/client";
import {
  appendImportedStoreOrder,
  importedRowExists,
  validateStoreImport,
} from "@/lib/google/importStoreOrder";
import { revalidateTag } from "next/cache";
import { STAFF_ORDERS_CACHE_TAG } from "@/lib/services/staffOrdersCacheService";
export async function POST(request: NextRequest) {
  const raw = await request.text(),
    ts = request.headers.get("x-pj-timestamp") || "",
    signature = request.headers.get("x-pj-signature") || "",
    secret = process.env.STORE_SYNC_SECRET;
  if (raw.length > 64000)
    return NextResponse.json({ error: "Too large" }, { status: 413 });
  if (
    !secret ||
    secret.length < 32 ||
    !Number.isFinite(Number(ts)) ||
    Math.abs(Date.now() - Number(ts)) > 300000 ||
    !validSignature(ts + "." + raw, signature, secret)
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = validateStoreImport(JSON.parse(raw));
    const hash = createHash("sha256").update(raw).digest("hex");
    const { error: insertError } = await supabase
      .from("store_sheet_receipts")
      .upsert(
        { order_ref: b.orderRef, payload_hash: hash },
        { onConflict: "order_ref", ignoreDuplicates: true },
      );
    if (insertError) throw Error("Receipt storage unavailable");
    const { data: r, error: readError } = await supabase
      .from("store_sheet_receipts")
      .select("*")
      .eq("order_ref", b.orderRef)
      .single();
    if (readError) throw Error("Receipt unavailable");
    if (r.payload_hash !== hash)
      return NextResponse.json(
        { error: "Order content changed" },
        { status: 409 },
      );
    if (r.state === "done")
      return NextResponse.json({ ok: true, orderRef: b.orderRef });
    if (await importedRowExists(b)) {
      const { error } = await supabase
        .from("store_sheet_receipts")
        .update({ state: "done" })
        .eq("order_ref", b.orderRef);
      if (error) throw Error("Receipt unavailable");
      return NextResponse.json({ ok: true, orderRef: b.orderRef });
    }
    if (r.state !== "pending")
      return NextResponse.json(
        {
          error:
            "Append outcome requires reconciliation. Check Google Sheet before retrying.",
        },
        { status: 503 },
      );
    const { data: claim, error: claimError } = await supabase
      .from("store_sheet_receipts")
      .update({ state: "writing", updated_at: new Date().toISOString() })
      .eq("order_ref", b.orderRef)
      .eq("state", "pending")
      .select("order_ref");
    if (claimError || !claim?.length)
      return NextResponse.json({ error: "Sync in progress" }, { status: 503 });
    await appendImportedStoreOrder(b);
    const { error: doneError } = await supabase
      .from("store_sheet_receipts")
      .update({ state: "done" })
      .eq("order_ref", b.orderRef);
    if (doneError) throw Error("Receipt unavailable");
    revalidateTag(STAFF_ORDERS_CACHE_TAG, { expire: 0 });
    return NextResponse.json({ ok: true, orderRef: b.orderRef });
  } catch {
    return NextResponse.json(
      {
        error:
          "Sheet sync pending. Reconcile uncertain appends before retrying.",
      },
      { status: 503 },
    );
  }
}
