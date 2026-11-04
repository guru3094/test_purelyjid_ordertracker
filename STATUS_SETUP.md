# Order status setup

This project now accepts the 27 WhatsApp statuses used by the Orders Google
Sheet dropdown. DEHYDRATION_IN_PROGRESS is excluded from the shared choices.

## Live database completion

The migration was applied to the purelyjid-order-tracker Supabase project on
11 October 2026. Readback confirmed 27 active statuses, all 10 original IDs
preserved, no DEHYDRATION_IN_PROGRESS entry, and all 71 orders retaining valid
status references. The existing update trigger required an updated_at column
that was missing in the live table; the migration restores that column.
The app changes still require deployment.

## Apply to an existing Supabase database

For another database or a future setup, run
database/migrations/016_expand_order_status_master.sql in the Supabase
SQL Editor for the database used by this app. It adds missing statuses and
updates the 27 matching records to be active. Existing IDs are preserved, so
orders continue to reference the same status records. The migration can be
run again safely and does not delete other historical statuses.

Then verify the entries:

```sql
SELECT status_code, status_name, fulfillment_method, display_order, is_active
FROM public.order_status_master
WHERE is_active = TRUE
ORDER BY display_order, status_code;
```

The initial master-data seed also contains these 27 choices for new databases.
Use migration 016 for an existing database; do not rerun the whole initial seed.

## Deploy the app changes

Deploy this updated project to the existing application. Adding the choices to
Google Sheets alone does not change the validator in a deployed app. On the
next scheduled sync after deployment, the new statuses can pass validation and
resolve against the updated database master data. Filters cache master data for
up to five minutes; a fresh deployment starts with an empty in-memory cache.

The status list is shared by lib/validation/statusValidator.ts and the order
editor fallback in lib/google/editOrder.ts through lib/constants/orderStatuses.ts.
Pickup-specific entries remain Pickup, delivery-specific entries remain
Delivery, and common entries use Both. Display order follows the customer
tracking stages; Cancelled uses 99.

## Verification performed

- All 27 statuses pass sync validation.
- DEHYDRATION_IN_PROGRESS and unknown statuses fail sync validation.
- Every included status has a configured WhatsApp sentence and a tracking-stage
  mapping, except Cancelled, which uses the existing exception card.
- Initial seed and migration status entries match the shared list.
- A compatibility database check verified migration reruns preserve existing
  IDs and do not duplicate rows. This local check used SQLite, not the live
  Supabase PostgreSQL database.
- The final migration, including the missing timestamp column fix, was applied
  successfully to live Supabase PostgreSQL and verified by database readback.

Downloading this ZIP does not apply the SQL migration or deploy the app.
