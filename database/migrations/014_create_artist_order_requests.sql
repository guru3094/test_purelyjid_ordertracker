create table if not exists public.artist_order_requests (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  customer_name text not null,
  order_date text not null,
  product_name text not null,
  requirements text,
  artist_cost numeric(12,2) not null default 0,
  artist_advance numeric(12,2) not null default 0,
  artist_balance numeric(12,2) not null default 0,
  estimated_delivery_date text,
  comments text,
  artist_status text not null default 'NOT_SENT',
  whatsapp_sent_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  artist_sheet_updated boolean not null default false,
  artist_sheet_updated_at timestamptz,
  acceptance_token_hash text,
  acceptance_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_order_requests_status_check
    check (artist_status in ('NOT_SENT','SENT','ACCEPTED','DECLINED'))
);
create index if not exists idx_artist_order_requests_order_id on public.artist_order_requests(order_id);
create index if not exists idx_artist_order_requests_status on public.artist_order_requests(artist_status);
create unique index if not exists idx_artist_order_requests_acceptance_token_hash
  on public.artist_order_requests(acceptance_token_hash)
  where acceptance_token_hash is not null;
