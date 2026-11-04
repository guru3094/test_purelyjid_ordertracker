# UI order date writing fix

The historical Orders entries store ORDER_DATE and LAST_UPDATED as text, for example 10/10/2026 and 1:19:02 PM. UI order creation already builds matching strings in Asia/Kolkata, but the USER_ENTERED append mode let Sheets automatically convert them to numeric dates and times. General cell formatting exposed those numbers, which the existing cron could not parse.

UI order creation now appends with valueInputOption RAW, preserving the date and time strings exactly as supplied, like the old entries. Product costs, advances, and balances remain numbers because those input values are numeric. No separate formatting request is necessary.

The original date parser, mapper, and both cron sync files are restored byte-for-byte from the supplied project. Earlier 27-status validator and master-data changes remain included. No Supabase schema changes are required for this date fix.

## Validation

Run with Node 24:

```sh
node --test tests/ui-order-sheet-formatting.test.mjs
```

The check exercises the actual UI append function with a mocked Google API and verifies RAW writes, historical date/time strings, Indian date, numeric balance, and acceptance by the original cron date parser. A full application build was not run because project dependencies are not installed in this workspace.

## Rollout

Deploy this project update for future UI orders. Existing numeric date/time cells must be converted to equivalent text in the historical format, then the existing cron can be rerun. No cron logic change is included.

The affected live row was corrected to equivalent date/time text in the historical format. Readback confirmed its displayed values and text storage. The application cron was not manually triggered.
