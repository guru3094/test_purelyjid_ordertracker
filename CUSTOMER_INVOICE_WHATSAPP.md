# Customer WhatsApp invoice and advance receipt

The **WhatsApp Customer** action is available after Create Sale and on each row of `/sales/orders`. It asks whether the product has been decided.

- **Yes:** the staff-only endpoint reads the order directly from the Orders Google Sheet (through the existing 60-second staff orders cache). The message includes the product name from column O, order amount from P, advance from Q, balance from R, fulfilment, tracking text and a link to the Classic A4 order invoice PDF. A missing product name or amount blocks sending until the Google Sheet is corrected.
- **No:** the WhatsApp message shows the order ID and advance paid, without the order amount or balance. Its PDF is an **Advance Receipt** showing the advance and that product selection is pending. The product name, total and balance are not included.

Both choices generate an encrypted, time-limited PDF link valid for seven days. The encrypted snapshot locks the data to what staff reviewed when preparing the WhatsApp message, even if the Google Sheet later changes. The PDF link is usable by whoever receives it; treat it like a private receipt. Customers can open or download the PDF without signing in. The endpoint stores no PDF or customer data in a new database table.

A `wa.me` link can prefill WhatsApp text and the PDF URL, but cannot attach a PDF file automatically. Staff review the WhatsApp message and tap **Send**. The confirmation dialog also offers an **Open PDF** link. The existing `NEXT_PUBLIC_APP_URL` must be the production site URL, and `STAFF_SESSION_SECRET` must be a private random string of at least 32 characters; rotating it invalidates old PDF links. No WhatsApp Business API is used.

The PDF uses the supplied shop name and address. GSTIN and tax breakdown fields are not shown because these details were not provided.

The PDF uses the included DejaVu font files under `lib/invoice/fonts`, with their license notice. The route is `/api/customer-invoice?token=...`; invalid and expired tokens are rejected.
