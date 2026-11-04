import { createClient } from "@supabase/supabase-js";

export type ArtistOrderStatus = {
  artistStatus: string;
  acceptedAt: string | null;
  sentAt: string | null;
  linkExpiresAt: string | null;
};

export async function getArtistOrderStatuses(orderIds: string[]): Promise<Record<string, ArtistOrderStatus>> {
  if (orderIds.length === 0) return {};
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY_KEY;
  if (!url || !key) throw new Error("Supabase service credentials are not configured.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const statuses: Record<string, ArtistOrderStatus> = {};

  // PostgREST URLs have practical length limits; fetch current orders in batches.
  for (let start = 0; start < orderIds.length; start += 100) {
    const { data, error } = await client.from("artist_order_requests")
      .select("order_id,artist_status,accepted_at,whatsapp_sent_at,acceptance_token_expires_at")
      .in("order_id", orderIds.slice(start, start + 100));
    if (error) throw new Error("Could not load Artist acceptance statuses.");
    for (const row of data ?? []) {
      statuses[row.order_id] = {
        artistStatus: row.artist_status,
        acceptedAt: row.accepted_at,
        sentAt: row.whatsapp_sent_at,
        linkExpiresAt: row.acceptance_token_expires_at,
      };
    }
  }
  return statuses;
}
