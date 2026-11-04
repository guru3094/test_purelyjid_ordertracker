# Resin Artist secure acceptance-link flow

Temporary flow while the Meta WhatsApp template is under review.

## Required setup
1. Run `database/migrations/014_create_artist_order_requests.sql` in Supabase.
2. Share the Resin Artist Google Sheet with `GOOGLE_CLIENT_EMAIL` as Editor.
3. Set these Vercel variables:
   - `RESIN_ARTIST_WHATSAPP_NUMBER` (international digits only)
   - `RESIN_ARTIST_GOOGLE_SHEET_ID=1__ATMqS2kRV5ZEhVl0GnDWUGaDpuybhgsFUl3fBJuGI`
   - `RESIN_ARTIST_GOOGLE_SHEET_TAB=Artist`
   - `NEXT_PUBLIC_APP_URL=https://purelyjid.in`
   - existing Supabase and Google credentials remain unchanged.

## Flow
Staff creates a customer order -> main Orders Google Sheet.
Staff opens Orders and clicks Send to Artist. If artist details have not been saved yet, the existing artist order form opens; after saving, the backend creates a 7-day one-time token and returns a wa.me message.
Artist opens the secure link -> sees order summary -> presses Accept Order.
Backend validates and consumes the token -> appends A:K to the Artist Sheet with Status `Pending` -> marks request accepted.

The main staff Orders list continues to read only from Google Sheets (60-second server cache). It does not query Supabase for artist status.
