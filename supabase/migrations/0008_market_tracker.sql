-- RIHOSO Market Tracker
-- Tracks publicly listed pre-owned watches over time: when each listing first appeared,
-- price changes, and when it left the market. Written only by the daily collector
-- (service role); everything here is public, read-only data for visitors.
--
-- Prices are ASKING prices. "Left the market" means the listing disappeared: it may have
-- sold or been withdrawn, so it is never called a sale unless the source says so
-- (only the RIHOSO Watch Exchange knows that).

-- ───────────────────────── sources ─────────────────────────
create table if not exists public.market_sources (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  kind text not null check (kind in ('retailer_cpo', 'retailer_preowned', 'marketplace', 'rihoso')),
  website text,
  enabled boolean not null default false,            -- the collector only runs enabled sources
  terms_checked_on date,                             -- when the site's terms/robots were last reviewed
  terms_note text,
  created_at timestamptz not null default now()
);

-- ───────────────────────── listings ─────────────────────────
create table if not exists public.market_listings (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.market_sources(id) on delete cascade,
  external_id text not null,                         -- the source's own listing/product id
  url text,
  brand text not null,
  model text,                                        -- collection / line, e.g. "Submariner Date"
  reference text,                                    -- as published
  reference_key text,                                -- normalized for grouping: upper case, no spaces/dashes
  year int,
  dial text,
  case_material text,
  case_size_mm numeric(5, 1),
  bracelet text,
  has_box boolean,
  has_papers boolean,
  certified boolean not null default false,          -- manufacturer-certified pre-owned
  currency text not null default 'USD',
  price_cents bigint,
  first_price_cents bigint,
  price_changes int not null default 0,
  status text not null default 'active' check (status in ('active', 'gone')),
  outcome text check (outcome in ('sold', 'removed')),-- only set when the source tells us
  seen_at_launch boolean not null default false,     -- already listed when tracking began: true age unknown
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  gone_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);
create index if not exists market_listings_status_idx on public.market_listings (status, first_seen_at);
create index if not exists market_listings_ref_idx on public.market_listings (brand, reference_key);
create index if not exists market_listings_gone_idx on public.market_listings (gone_at desc) where status = 'gone';

-- Price history: one row whenever a listing's asking price changes (plus its first price).
create table if not exists public.market_price_events (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  observed_at timestamptz not null default now(),
  price_cents bigint not null,
  previous_cents bigint
);
create index if not exists market_price_events_listing_idx on public.market_price_events (listing_id, observed_at);

-- One row per collector run per source (health + coverage).
create table if not exists public.market_runs (
  id bigint generated always as identity primary key,
  source_id text not null references public.market_sources(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  expected int,                                      -- how many listings the source says it has
  seen int,
  added int,
  gone int,
  price_changes int,
  coverage numeric(5, 4),                            -- seen / expected
  requests int,
  error text
);
create index if not exists market_runs_source_idx on public.market_runs (source_id, started_at desc);

-- Daily per-reference snapshot (all sources combined) for price and supply trends.
create table if not exists public.market_reference_daily (
  day date not null,
  brand text not null,
  reference_key text not null,
  model text,
  active_count int not null,
  median_cents bigint,
  min_cents bigint,
  max_cents bigint,
  added_count int not null default 0,
  gone_count int not null default 0,
  primary key (day, brand, reference_key)
);

-- ───────────────────────── access ─────────────────────────
alter table public.market_sources enable row level security;
alter table public.market_listings enable row level security;
alter table public.market_price_events enable row level security;
alter table public.market_runs enable row level security;
alter table public.market_reference_daily enable row level security;

drop policy if exists "market sources are public" on public.market_sources;
create policy "market sources are public" on public.market_sources for select using (true);
drop policy if exists "market listings are public" on public.market_listings;
create policy "market listings are public" on public.market_listings for select using (true);
drop policy if exists "market prices are public" on public.market_price_events;
create policy "market prices are public" on public.market_price_events for select using (true);
drop policy if exists "market daily is public" on public.market_reference_daily;
create policy "market daily is public" on public.market_reference_daily for select using (true);
drop policy if exists "market runs for admins" on public.market_runs;
create policy "market runs for admins" on public.market_runs for select using (public.is_admin());

revoke insert, update, delete on public.market_sources, public.market_listings, public.market_price_events,
  public.market_runs, public.market_reference_daily from anon, authenticated;

-- ───────────────────────── analytics ─────────────────────────
-- Per-reference statistics over all sources. security_invoker keeps the table policies in force.
create or replace view public.market_reference_stats with (security_invoker = true) as
with l as (
  select *,
    extract(epoch from (now() - first_seen_at)) / 86400.0 as age_days,
    case when status = 'gone' then extract(epoch from (gone_at - first_seen_at)) / 86400.0 end as life_days
  from public.market_listings
  where reference_key is not null and reference_key <> ''
)
select
  brand,
  reference_key,
  (array_agg(reference order by last_seen_at desc))[1] as reference,
  (array_agg(model order by last_seen_at desc) filter (where model is not null))[1] as model,
  count(*) filter (where status = 'active')::int as active_count,
  percentile_cont(0.5) within group (order by price_cents) filter (where status = 'active' and price_cents is not null) as median_cents,
  min(price_cents) filter (where status = 'active') as min_cents,
  max(price_cents) filter (where status = 'active') as max_cents,
  percentile_cont(0.5) within group (order by age_days) filter (where status = 'active') as median_age_days,
  count(*) filter (where status = 'gone' and gone_at > now() - interval '30 days')::int as gone_30d,
  count(*) filter (where first_seen_at > now() - interval '30 days' and not seen_at_launch)::int as added_30d,
  -- time to leave the market, only for listings whose whole life we observed
  percentile_cont(0.5) within group (order by life_days) filter (where status = 'gone' and not seen_at_launch) as median_days_to_leave,
  count(*) filter (where status = 'gone' and not seen_at_launch)::int as observed_exits,
  count(*) filter (where status = 'active' and price_changes > 0)::int as repriced_count,
  count(distinct source_id) filter (where status = 'active')::int as source_count
from l
group by brand, reference_key;

-- Writes today's (or the given day's) snapshot into market_reference_daily. Called by the collector.
create or replace function public.market_take_snapshot(p_day date default (now() at time zone 'America/New_York')::date)
returns int
language plpgsql security definer set search_path = ''
as $$
declare n int;
begin
  insert into public.market_reference_daily
    (day, brand, reference_key, model, active_count, median_cents, min_cents, max_cents, added_count, gone_count)
  select
    p_day, brand, reference_key,
    (array_agg(model order by last_seen_at desc) filter (where model is not null))[1],
    count(*) filter (where status = 'active'),
    (percentile_cont(0.5) within group (order by price_cents) filter (where status = 'active' and price_cents is not null))::bigint,
    min(price_cents) filter (where status = 'active'),
    max(price_cents) filter (where status = 'active'),
    count(*) filter (where (first_seen_at at time zone 'America/New_York')::date = p_day and not seen_at_launch),
    count(*) filter (where status = 'gone' and (gone_at at time zone 'America/New_York')::date = p_day)
  from public.market_listings
  where reference_key is not null and reference_key <> ''
  group by brand, reference_key
  having count(*) filter (where status = 'active') > 0
      or count(*) filter (where status = 'gone' and (gone_at at time zone 'America/New_York')::date = p_day) > 0
  on conflict (day, brand, reference_key) do update set
    model = excluded.model, active_count = excluded.active_count, median_cents = excluded.median_cents,
    min_cents = excluded.min_cents, max_cents = excluded.max_cents,
    added_count = excluded.added_count, gone_count = excluded.gone_count;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.market_take_snapshot(date) from public, anon, authenticated;

-- ───────────────────────── seed sources ─────────────────────────
insert into public.market_sources (id, name, kind, website, enabled, terms_checked_on, terms_note) values
  ('bucherer-us', 'Tourneau | Bucherer', 'retailer_cpo', 'https://www.bucherer.com/us/en/rolex-certified-pre-owned/watches', true, '2026-10-27',
   'US Terms of Use contain no restriction on automated access; robots.txt allows the pre-owned listing pages. Collected once daily with an identifying user agent. Photos are not copied.'),
  ('rihoso-exchange', 'RIHOSO Watch Exchange', 'rihoso', 'https://rihoso.com/marketplace', true, '2026-10-27',
   'RIHOSO''s own marketplace listings.'),
  ('wos-group', 'Watches of Switzerland Group (incl. Mayors, Betteridge)', 'retailer_cpo', 'https://www.watchesofswitzerland.com', false, '2026-10-27',
   'Disabled: their terms prohibit robots, spiders and data extraction (section 1.2). Needs written permission before it can be added.')
on conflict (id) do nothing;
