# Create Sale integration

This version integrates the internal Create Sale feature into the existing PurelyJid Next.js 16 project rather than adding a second application.

## API
- Existing `GET /api/orders` is preserved.
- New authenticated `POST /api/orders` appends one row to `Orders!A:S`.
- Existing Google Sheet -> queue -> Supabase sync remains unchanged.

## Google integration
`lib/google/auth.ts` now requests the write-capable `spreadsheets` scope. The same `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, and `GOOGLE_SHEET_ID` environment variables are reused.

## Staff UI
- `/staff-login`
- `/sales/create`

The public storefront does not link to these pages. Authentication is still required even if the URL is known.

## Product categories
The form deliberately uses the categories already accepted by the main project: `Resin Art`, `Workshop`, and `Raw Materials`.

## Required new environment variables
- `STAFF_USERNAME`
- `STAFF_PASSWORD`
- `STAFF_SESSION_SECRET` (minimum 32 characters)

## Google Sheet permissions
The service-account email must have Editor access to the existing Google Sheet because the app now appends rows.

## Notifications
SMS/WhatsApp is not wired in this build because provider credentials and templates are not yet finalized.

## Manual WhatsApp confirmation
After successful order creation, staff can click **Send Confirmation on WhatsApp**. This uses a `wa.me` deep link only—no WhatsApp API, provider, token, or webhook. The salesperson manually presses Send. The Google Sheet order is saved before the WhatsApp action is offered.


## Google Sheet date/time compatibility fix
New Create Sale rows now match historical working rows:
- ORDER_DATE: M/D/YYYY (example: 8/11/2026)
- LAST_UPDATED: h:mm:ss AM/PM (example: 2:30:34 PM)
- EXPECTED_DELIVERY_DATE remains blank on creation.


## Enhancement package
- Remarks maps to Google Sheet `REMARKS` (column K).
- `/sales/orders` reads all orders directly from Google Sheets via authenticated `/api/staff/orders` and supports search/status/fulfilment/category filters.
- Sidebar navigation adds Create Sale and Orders.
- Artist requests are started from `/sales/orders` using **Send to Artist**. Create Sale contains customer order fields and the customer WhatsApp action only. Configure `RESIN_ARTIST_WHATSAPP_NUMBER` for the artist request.
- **WhatsApp Customer** is available after Create Sale and from Orders. Staff select whether the product has been decided. A decided product uses the existing amounts and an invoice PDF link; an undecided product sends the advance only with an advance receipt link. See `CUSTOMER_INVOICE_WHATSAPP.md`.
- After order creation, Next.js `after()` runs the existing Google Sheet -> queue -> Supabase sync asynchronously. Daily cron remains as reconciliation/fallback.
