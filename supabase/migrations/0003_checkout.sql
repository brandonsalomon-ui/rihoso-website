-- RIHOSO Watch Exchange — offers, checkout, held payments, shipping/pickup, disputes.
-- All writes here happen on the server (service role); members can only read their own rows.

-- How a watch can change hands
alter table public.listings
  add column if not exists allows_shipping boolean not null default true,
  add column if not exists allows_pickup boolean not null default false,
  add column if not exists pickup_area text check (char_length(pickup_area) <= 80);

grant update (allows_shipping, allows_pickup, pickup_area) on public.listings to authenticated;

-- A seller's "sell to this buyer at $X" from inside a conversation
create type public.offer_status as enum ('open', 'paid', 'cancelled', 'expired');

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents int not null check (amount_cents between 100 and 100000000),
  allows_shipping boolean not null default true,
  allows_pickup boolean not null default false,
  status public.offer_status not null default 'open',
  expires_at timestamptz not null default now() + interval '72 hours',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (allows_shipping or allows_pickup)
);
create index offers_conversation_idx on public.offers (conversation_id, created_at desc);
create index offers_listing_open_idx on public.offers (listing_id) where status = 'open';
alter table public.offers enable row level security;
create policy "participants see offers" on public.offers for select
  using (auth.uid() in (buyer_id, seller_id) or public.is_admin());
create trigger offers_updated_at before update on public.offers
  for each row execute function public.set_updated_at();

-- Orders: fulfilment, shipping details, disputes
create type public.fulfillment_method as enum ('ship', 'pickup');

alter table public.orders
  add column if not exists offer_id uuid references public.offers(id),
  add column if not exists conversation_id uuid references public.conversations(id),
  add column if not exists fulfillment public.fulfillment_method not null default 'ship',
  add column if not exists shipping_name text,
  add column if not exists shipping_address jsonb,
  add column if not exists stripe_charge_id text,
  add column if not exists seller_payout_cents int check (seller_payout_cents >= 0),
  add column if not exists dispute_reason text check (char_length(dispute_reason) <= 4000),
  add column if not exists disputed_at timestamptz,
  add column if not exists refunded_at timestamptz;

create index if not exists orders_auto_release_idx on public.orders (auto_release_at) where status = 'delivered';
create index if not exists orders_offer_idx on public.orders (offer_id);

-- Only one live order per listing at a time
create unique index if not exists orders_one_active_per_listing
  on public.orders (listing_id)
  where status in ('paid_held', 'shipped', 'delivered', 'disputed');
