begin;
alter table public.courier_shipments drop constraint courier_shipments_state_check;
alter table public.courier_shipments add constraint courier_shipments_state_check check(state in('draft','requested','accepted','declined','payment_confirmed','submitting','manifested','booked','cancelling','needs_review','cancelled'));
alter table public.courier_shipments
 add column provider text not null default 'borzo' check(provider in('borzo','delhivery')),
 add column revision integer not null default 1,
 add column accepted_at timestamptz,
 add column payment_confirmed_at timestamptz,
 add column payment_reference text,
 add column paid_amount numeric(12,2),
 add column delhivery_awb text unique,
 add column provider_checked_at timestamptz,
 add column quote_checked_at timestamptz,
 add column pickup_date date,
 add column pickup_request_id text;
-- Warehouse pickups are shared across parcels. Never blindly create another request after an uncertain response.
create table public.delhivery_pickups(
 id uuid primary key default gen_random_uuid(), location text not null, pickup_date date not null,
 state text not null check(state in('submitting','confirmed','needs_review')),provider_id text,
 expected_package_count integer not null check(expected_package_count>0),updated_at timestamptz not null default now(),
 unique(location,pickup_date)
);
alter table public.delhivery_pickups enable row level security;
revoke all on public.delhivery_pickups from public,anon,authenticated;
grant select,insert,update on public.delhivery_pickups to service_role;
-- Replaces the old index so a declined proposal can be replaced with a new request.
drop index public.one_open_courier_per_order;
create unique index one_open_courier_per_order on public.courier_shipments(order_ref) where state not in('cancelled','declined');
create table public.courier_request_events (
 id bigint generated always as identity primary key, shipment_id uuid not null references public.courier_shipments(id),
 created_at timestamptz not null default now(), previous jsonb, current jsonb not null
);
alter table public.courier_request_events enable row level security;
revoke all on public.courier_request_events from public,anon,authenticated;
grant select,insert on public.courier_request_events to service_role;
grant usage,select on sequence public.courier_request_events_id_seq to service_role;
create function public.audit_courier_request() returns trigger language plpgsql security invoker set search_path='' as $$
declare before_data jsonb;after_data jsonb;
begin
 after_data=jsonb_build_object('state',new.state,'revision',new.revision,'amount',new.amount,'accepted_at',new.accepted_at,'payment_confirmed_at',new.payment_confirmed_at,'payment_reference',new.payment_reference,'paid_amount',new.paid_amount);
 if tg_op='UPDATE' then before_data=jsonb_build_object('state',old.state,'revision',old.revision,'amount',old.amount,'accepted_at',old.accepted_at,'payment_confirmed_at',old.payment_confirmed_at,'payment_reference',old.payment_reference,'paid_amount',old.paid_amount);end if;
 if before_data is distinct from after_data then insert into public.courier_request_events(shipment_id,previous,current) values(new.id,before_data,after_data);end if;
 return new;
end$$;
revoke all on function public.audit_courier_request() from public,anon,authenticated;
grant execute on function public.audit_courier_request() to service_role;
create trigger courier_request_audit after insert or update on public.courier_shipments for each row execute function public.audit_courier_request();
commit;
