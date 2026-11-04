-- Tracks one email per acceptance event, including retries and failures.
create table if not exists public.artist_acceptance_email_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,
  accepted_at timestamptz not null,
  status text not null default 'SENDING'
    check (status in ('SENDING', 'SENT', 'FAILED')),
  attempted_at timestamptz not null default now(),
  sent_at timestamptz,
  email_to text,
  provider_message_id text,
  last_error text,
  unique (order_id, accepted_at)
);

-- This table is only used by the server-side service-role client.
alter table public.artist_acceptance_email_notifications enable row level security;
