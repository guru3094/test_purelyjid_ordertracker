# Staff order editing

Each row on `/sales/orders` has **Edit Order**. The edit page loads the latest
`Orders!A:S` values directly from Google Sheets and shows all 19 columns. It
uses date inputs for date cells, number inputs for amounts, and dropdowns from
the Sheet's cell validation when available. Fulfilment, status, courier and
product category have the project's existing dropdown values as a fallback.
Every optional input can be cleared. Order ID remains read-only because it is
the row and artist-request identifier; Last Updated is filled automatically on
save. Editing a price or advance recalculates the balance, which staff may then
adjust separately.

`GET /api/staff/orders/{orderId}` returns `{order, version, options}`.
`PUT /api/staff/orders/{orderId}` accepts `{version, order}`, where `order`
contains every field from `orderId` through `productCategory` in the same A:S
order. Blank fields are submitted as empty strings. Both endpoints require a
staff session. `version` detects changes made in the Sheet since the edit page
loaded; conflicts return HTTP 409 and require a reload.

The PUT call waits for Google Sheets `values.update` and a readback before it
returns success. It then expires the staff Orders cache. Next.js `after()`
invokes the existing `/api/cron/google-sheet-sync` handler with the server's
`CRON_SECRET`, so Supabase synchronization runs after the response. No cron
secret is sent to the browser or through a self-HTTP request. The daily Vercel
cron remains configured and unchanged.

The Google Sheet accepts blank fields. The existing Supabase tracking schema
and sync validator still require some fields such as customer name, valid
status and fulfilment, plus a courier for Delivery. An edit can save to Google
Sheets while the background sync skips a row with missing tracking fields. The
editor shows this note.

The production environment must continue to provide `GOOGLE_SHEET_ID`, Google
service-account credentials, `STAFF_USERNAME`, `STAFF_PASSWORD`,
`STAFF_SESSION_SECRET`, Supabase credentials, and `CRON_SECRET`.
