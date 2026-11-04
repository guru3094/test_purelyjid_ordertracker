-- Track the reviewed artist-facing description for acceptance and Sheet sync.
-- remarks was reserved during preparation; artist flows do not populate or display it.
alter table public.artist_order_requests
  add column if not exists remarks text not null default '',
  add column if not exists artist_sheet_product_name text,
  add column if not exists artist_sheet_needs_update boolean not null default false;
-- Existing grants/RLS stay intact; explicitly retain server-side CRUD access.
grant select, insert, update, delete on public.artist_order_requests to service_role;
