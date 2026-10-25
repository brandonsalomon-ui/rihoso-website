-- RIHOSO Watch Exchange — core schema
-- Who can see/do what is enforced here with row-level security (RLS).
-- Anything money- or trust-related (seller Stripe accounts, orders, member status,
-- validation results) is written only by the server with the service-role key.

-- ───────────────────────── helpers ─────────────────────────
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- no policies: only the service role can read/write admins

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end $$;

-- ───────────────────────── profiles ─────────────────────────
-- Public-facing identity (shown on listings and in messages).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Collector' check (char_length(display_name) between 1 and 80),
  is_member boolean not null default false,          -- verified RIHOSO member (admin-set)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles are public" on public.profiles for select using (true);
create policy "users edit own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
-- users may only change their display name; is_member is server/admin-only
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- create a profile automatically for every new sign-in
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    -- never derive a public name from the email address
    coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'), 80), ''), 'Collector')
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── sellers ─────────────────────────
-- Private seller details. Readable by the seller; written only by the server.
create table public.seller_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_account_id text not null unique,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  full_name text,
  phone text,
  member_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.seller_accounts enable row level security;
create policy "sellers read own account" on public.seller_accounts for select
  using (user_id = auth.uid() or public.is_admin());
create trigger seller_accounts_updated_at before update on public.seller_accounts
  for each row execute function public.set_updated_at();

create or replace function public.can_sell(uid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.seller_accounts where user_id = uid and payouts_enabled) $$;

-- ───────────────────────── listings ─────────────────────────
create type public.watch_condition as enum
  ('new', 'unworn', 'excellent', 'very_good', 'good', 'fair', 'for_parts');
create type public.listing_status as enum
  ('draft', 'active', 'reserved', 'sold', 'withdrawn', 'removed');
create type public.validation_status as enum
  ('none', 'requested', 'in_progress', 'passed', 'concerns');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  brand text not null check (char_length(brand) between 1 and 60),
  model text check (char_length(model) <= 80),
  reference text check (char_length(reference) <= 60),
  year int check (year between 1700 and 2100),
  condition public.watch_condition not null,
  has_box boolean not null default false,
  has_papers boolean not null default false,
  description text not null default '' check (char_length(description) <= 8000),
  price_cents int not null check (price_cents between 100 and 100000000),
  status public.listing_status not null default 'draft',
  validation_status public.validation_status not null default 'none',
  validation_notes text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_status_published_idx on public.listings (status, published_at desc);
create index listings_seller_idx on public.listings (seller_id);
create index listings_brand_idx on public.listings (lower(brand));
alter table public.listings enable row level security;

create policy "public sees live listings; sellers see their own" on public.listings for select
  using (status in ('active', 'reserved', 'sold') or seller_id = auth.uid() or public.is_admin());
create policy "verified sellers create listings" on public.listings for insert
  with check (
    seller_id = auth.uid()
    and status in ('draft', 'active')
    and (status = 'draft' or public.can_sell(auth.uid()))
  );
create policy "sellers edit own open listings" on public.listings for update
  using (seller_id = auth.uid() and status in ('draft', 'active', 'withdrawn'))
  with check (
    seller_id = auth.uid()
    and status in ('draft', 'active', 'withdrawn')
    and (status <> 'active' or public.can_sell(auth.uid()))
  );
create policy "sellers delete own drafts" on public.listings for delete
  using (seller_id = auth.uid() and status = 'draft');
-- sellers can't touch validation or sale state
revoke update on public.listings from anon, authenticated;
grant update (title, brand, model, reference, year, condition, has_box, has_papers, description, price_cents, status)
  on public.listings to authenticated;

create or replace function public.listings_before_write()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.status = 'active' and new.published_at is null then
    new.published_at = now();
  end if;
  new.updated_at = now();
  return new;
end $$;
create trigger listings_before_write before insert or update on public.listings
  for each row execute function public.listings_before_write();

-- ───────────────────────── photos ─────────────────────────
create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index listing_photos_listing_idx on public.listing_photos (listing_id, position);
alter table public.listing_photos enable row level security;
create policy "photos follow listing visibility" on public.listing_photos for select
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy "sellers add photos to own listings" on public.listing_photos for insert
  with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()
            and l.status in ('draft', 'active'))
    and storage_path like auth.uid()::text || '/%'
  );
create policy "sellers remove photos from own listings" on public.listing_photos for delete
  using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()
                 and l.status in ('draft', 'active', 'withdrawn')));

-- Storage: public bucket for listing photos; each user writes only under their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

create policy "users upload to own photo folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────────────────── messaging ─────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);
create index conversations_buyer_idx on public.conversations (buyer_id, last_message_at desc);
create index conversations_seller_idx on public.conversations (seller_id, last_message_at desc);
alter table public.conversations enable row level security;
create policy "participants see conversations" on public.conversations for select
  using (auth.uid() in (buyer_id, seller_id) or public.is_admin());
create policy "buyers start conversations on live listings" on public.conversations for insert
  with check (
    buyer_id = auth.uid()
    and exists (select 1 from public.listings l
                where l.id = listing_id and l.seller_id = conversations.seller_id
                  and l.status in ('active', 'reserved') and l.seller_id <> auth.uid())
  );

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);
alter table public.messages enable row level security;
create policy "participants read messages" on public.messages for select
  using (exists (select 1 from public.conversations c where c.id = conversation_id
                 and (auth.uid() in (c.buyer_id, c.seller_id) or public.is_admin())));
create policy "participants send messages" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (select 1 from public.conversations c where c.id = conversation_id
                and auth.uid() in (c.buyer_id, c.seller_id))
  );

create or replace function public.bump_conversation()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end $$;
create trigger messages_bump_conversation after insert on public.messages
  for each row execute function public.bump_conversation();

-- ───────────────────────── orders (server-only writes) ─────────────────────────
create type public.order_status as enum
  ('pending_payment', 'paid_held', 'shipped', 'delivered', 'released', 'disputed', 'refunded', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  amount_cents int not null check (amount_cents > 0),
  commission_cents int not null check (commission_cents >= 0),
  status public.order_status not null default 'pending_payment',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_transfer_id text unique,
  shipping_carrier text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  auto_release_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index orders_seller_idx on public.orders (seller_id, created_at desc);
create index orders_listing_idx on public.orders (listing_id);
alter table public.orders enable row level security;
create policy "buyers and sellers see their orders" on public.orders for select
  using (auth.uid() in (buyer_id, seller_id) or public.is_admin());
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ───────────────────────── validation & repair requests ─────────────────────────
create type public.service_type as enum ('validation', 'repair');
create type public.service_status as enum
  ('requested', 'awaiting_payment', 'paid', 'in_progress', 'complete', 'cancelled');

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  type public.service_type not null,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  description text not null default '' check (char_length(description) <= 4000),
  status public.service_status not null default 'requested',
  price_cents int check (price_cents >= 0),
  stripe_checkout_session_id text unique,
  assigned_to uuid references public.profiles(id),
  result_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index service_requests_requester_idx on public.service_requests (requester_id, created_at desc);
alter table public.service_requests enable row level security;
create policy "requesters see their requests" on public.service_requests for select
  using (requester_id = auth.uid() or assigned_to = auth.uid() or public.is_admin());
create trigger service_requests_updated_at before update on public.service_requests
  for each row execute function public.set_updated_at();
