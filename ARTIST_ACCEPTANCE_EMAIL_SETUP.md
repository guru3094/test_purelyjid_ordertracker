# Automatic artist acceptance email

When `artist_order_requests.artist_status` changes from a different status to
`ACCEPTED`, Supabase sends an asynchronous `UPDATE` webhook to the app. The app
checks the webhook secret, verifies the current database row, then sends one
email using Resend. It logs `SENDING`, `SENT`, or `FAILED` in
`artist_acceptance_email_notifications`. An update to an already accepted row
does not send another email. The existing Google Sheet write and the optional
manual WhatsApp reply continue to work as before.

Only one Artist request link may be active at a time for an order. Once its
seven-day expiry passes, staff can send a fresh link. Staff can also send a
fresh link after acceptance. That changes the artist status back to `SENT`;
accepting the new link produces a new response and email, while the existing
Artist Sheet entry is reused (there is no second append). Previous accepted
email log rows remain as history.

## Production setup

1. Run `database/migrations/015_create_artist_acceptance_email_notifications.sql`
   in the existing Supabase project's SQL Editor. Keep migration 014 and its
   `artist_order_requests` table in place.
2. Create a free Resend account and verify a domain/subdomain you control.
   Add the DNS records Resend supplies at your domain's DNS host. Create a
   Resend API key with sending permission. The free tier currently allows
   3,000 emails/month and 100/day. You can use any recipient mailbox.
3. Set these **Production** environment variables in Vercel, then deploy the
   updated project:

   ```text
   RESEND_API_KEY=<your Resend API key>
   ARTIST_ACCEPTANCE_EMAIL_FROM=PurelyJid <orders@your-verified-domain>
   ARTIST_ACCEPTANCE_EMAIL_TO=<the staff mailbox to notify>
   ARTIST_ACCEPTANCE_WEBHOOK_SECRET=<a new random string, at least 32 characters>
   ```

   Keep the existing Google and Supabase environment variables. This does not
   use the Google service account as an email sender. You do **not** need to
   configure a WhatsApp number for email alerts.
4. In Supabase **Database → Webhooks → Create a new webhook**:
   - Name: `artist_accepted_email`
   - Table: `public.artist_order_requests`
   - Event: `UPDATE` only
   - Type: HTTP request; Method: `POST`
   - URL: `https://www.purelyjid.in/api/webhooks/artist-accepted` (use the
     domain that resolves to your deployed app)
   - HTTP headers: `Content-Type: application/json` and
     `Authorization: Bearer <the exact ARTIST_ACCEPTANCE_WEBHOOK_SECRET>`.

   Save the webhook after the migration and the deployed route are ready.
   Supabase webhook requests are asynchronous and do not hold up acceptance.

## Test

Use a fresh test order (or reset an accepted test order as described below).
Send it to the artist and accept it. Check:

1. The Artist Google Sheet has the order.
2. The staff Orders page shows **Accepted**.
3. The staff mailbox receives **Artist accepted PurelyJid order <order ID>**.
4. In Supabase SQL Editor:

   ```sql
   select order_id, accepted_at, status, sent_at, last_error
   from public.artist_acceptance_email_notifications
   order by attempted_at desc limit 10;
   ```

If the email did not arrive, check the Supabase Database Webhook logs, the
Vercel Function logs, Resend email logs, and the notification row above. A
`FAILED` notification can be retried by replaying the original authenticated
webhook request. If you reset an accepted test order in Supabase and accept it
again, the new `accepted_at` creates a distinct notification. The previous
Artist Sheet row remains until you remove it manually.

The optional `RESIN_ARTIST_ACCEPTANCE_NOTIFY_NUMBER` controls only the separate
WhatsApp `wa.me` reply. Remove or leave it empty if you only want email. Resend
and Supabase free-tier limits can change; check their current plans before
using this for high-volume orders.
