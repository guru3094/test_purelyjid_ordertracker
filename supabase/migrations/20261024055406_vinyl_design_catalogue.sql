-- Staff uses the existing signed staff session; no browser role writes this table.
create table public.vinyl_designs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9-]{1,29}$'),
  name text not null check (length(name) between 1 and 100),
  category text not null check (category in ('Ganesha','Religious Symbols','Wedding Motifs','Decorative Designs')),
  published boolean not null default false,
  width double precision not null check (width > 0 and width < 20000000),
  height double precision not null check (height > 0 and height < 20000000),
  outline jsonb not null check (jsonb_typeof(outline) = 'object'),
  thumbnail text check (octet_length(thumbnail) <= 340000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vinyl_designs enable row level security;
revoke all on public.vinyl_designs from public, anon, authenticated;
grant select, insert, update, delete on public.vinyl_designs to service_role;
-- Public reads are filtered to published=true in server routes. No public policy
-- is created: private outlines, drafts and thumbnails stay behind those routes.
