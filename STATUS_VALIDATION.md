# 27-status validation results

Verified on October 12, 2026 (India time).

- The live Orders sheet G2:G995 has the same strict 27-choice dropdown as ORDER_STATUSES. DEHYDRATION_IN_PROGRESS is excluded.
- All 27 choices have matching active Supabase order_status_master records.
- The actual validator, sheet mapper, original date parser, queue processor, status/courier repositories, order mapper, and order insert/update repositories passed with a mocked Supabase client seeded from the verified status and courier reference. Both sync entry points were exercised.
- 45 valid status/fulfilment combinations cover Both statuses with Pickup and Delivery, and method-specific statuses with their corresponding method. Each sync entry point passed 45 inserts and 45 updates, for 180 successful application test operations and zero failures.
- Live Supabase accepted the mapped payloads for 45 inserts and 45 updates, covering all 27 status IDs. The complete test transaction was rolled back. Production order count remained 72, and zero STATUS_TEST_ orders remained.
- The UI append regression check passed: RAW preserves historical M/D/YYYY and h:mm:ss AM/PM text, monetary values remain numeric, and the original cron parser accepts those strings.

Run with Node 24:

```sh
node --test tests/status-sync.test.mjs tests/ui-order-sheet-formatting.test.mjs
```

The committed reference fixture uses synthetic UUIDs rather than actual production record IDs. Live checks were performed separately with the actual IDs. No application runtime or cron logic changes were introduced by these checks. No full Next.js build or deployed HTTP cron test was run because local application dependencies and production runtime credentials are unavailable. These checks verify all status values and database writes, rather than the production scheduler/authentication configuration.
