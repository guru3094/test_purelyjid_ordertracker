begin;
create table public.courier_shipments (
 id uuid primary key default gen_random_uuid(), order_ref text not null,
 access_hash text not null unique, customer_enabled boolean not null default false,
 input jsonb not null, state text not null default 'draft' check(state in('draft','submitting','booked','needs_review','cancelled')),
 borzo_id bigint unique, provider_status text, delivery_status text, amount numeric(12,2),
 provider_updated_at timestamptz, delivery_updated_at timestamptz, created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index one_open_courier_per_order on public.courier_shipments(order_ref) where state <> 'cancelled';
alter table public.courier_shipments enable row level security;
revoke all on public.courier_shipments from public,anon,authenticated;
grant select,insert,update on public.courier_shipments to service_role;
create function public.apply_borzo_event(provider_id bigint,event_at timestamptz,new_status text,new_delivery_status text,client_reference text) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 update public.courier_shipments set borzo_id=provider_id,provider_status=new_status,delivery_status=case when delivery_updated_at is null then coalesce(new_delivery_status,delivery_status) else delivery_status end,provider_updated_at=event_at,updated_at=now(),
 state=case when new_status='canceled' then 'cancelled' when state in('submitting','needs_review') then 'booked' else state end
 where (borzo_id=provider_id or (borzo_id is null and replace(id::text,'-','')=client_reference and state in('submitting','needs_review')))
 and (provider_updated_at is null or provider_updated_at<event_at);
 return exists(select 1 from public.courier_shipments where borzo_id=provider_id);
end$$;
revoke all on function public.apply_borzo_event(bigint,timestamptz,text,text,text) from public,anon,authenticated;
grant execute on function public.apply_borzo_event(bigint,timestamptz,text,text,text) to service_role;
create function public.apply_borzo_delivery_event(provider_id bigint,event_at timestamptz,new_status text,client_reference text) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 update public.courier_shipments set borzo_id=provider_id,delivery_status=new_status,delivery_updated_at=event_at,updated_at=now(),state=case when state in('submitting','needs_review') then 'booked' else state end
 where (borzo_id=provider_id or (borzo_id is null and replace(id::text,'-','')=client_reference and state in('submitting','needs_review')))
 and (delivery_updated_at is null or delivery_updated_at<event_at);
 return exists(select 1 from public.courier_shipments where borzo_id=provider_id);
end$$;
revoke all on function public.apply_borzo_delivery_event(bigint,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.apply_borzo_delivery_event(bigint,timestamptz,text,text) to service_role;
create table public.store_sheet_receipts(order_ref text primary key, payload_hash text not null,state text not null default 'pending',updated_at timestamptz not null default now());
alter table public.store_sheet_receipts enable row level security;
revoke all on public.store_sheet_receipts from public,anon,authenticated;
grant select,insert,update on public.store_sheet_receipts to service_role;
commit;
