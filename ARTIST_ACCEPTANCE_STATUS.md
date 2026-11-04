# Artist acceptance updates

This package uses the existing service-account write to the protected Artist
Google Sheet. It does not require the owner OAuth connection or a WhatsApp
Business API.

After a successful Artist Sheet append, the request is marked `ACCEPTED` in
Supabase. The staff Orders page reads that status and displays an **Accepted**
badge beside the order. It refreshes every 30 seconds while the page is open,
refreshes again when the browser tab regains focus, and also shows recently
accepted orders in a notice at the top. The customer order status remains
separate. A failure to load artist statuses is shown explicitly on the page.

For a WhatsApp confirmation triggered by the same **Accept Order** button, set
`RESIN_ARTIST_ACCEPTANCE_NOTIFY_NUMBER` to the staff recipient's international
phone number (digits only, for example `91XXXXXXXXXX`) in Vercel and redeploy.
After the Sheet write and acceptance succeed, the button opens a prefilled
WhatsApp message with the order ID and product in the same browser tab. The
artist must tap **Send**. A `wa.me` link cannot send on its own.

The reply is separate from the outbound order request: "PurelyJid Artist
Acceptance", Order ID, Product, and "I accept this order." The one-time
acceptance link is not included in the reply.

If that environment variable is empty, acceptance succeeds and displays its
confirmation without opening WhatsApp. The Orders page badge and notice work
independently of WhatsApp. The number used to send the
order to the artist remains `RESIN_ARTIST_WHATSAPP_NUMBER`; do not reuse it as
the staff notification recipient unless that is intentional.

The latest update also supports a new request link after the previous link
expires or an acceptance is recorded. There is only one active link at a time.
For an order already recorded in the Artist Sheet, accepting a fresh link
records another confirmation and sends the configured email notification,
without appending a duplicate Sheet row. See `ARTIST_ACCEPTANCE_EMAIL_SETUP.md`
for the email webhook and free-tier setup.
