-- Repair partner program: local workshops pay an annual sponsorship, are approved by RIHOSO, and quote on
-- repair requests the customer chooses to send them. The customer compares quotes and picks one; only the
-- chosen workshop sees the customer's contact details. RIHOSO's referral fee is included in the shop's price.
-- Additive only: requests without partners keep the existing RIHOSO-quoted flow.

create table if not exists public.repair_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 120),
  contact_name text not null check (char_length(contact_name) between 1 and 120),
  phone text check (char_length(phone) <= 40),
  website text check (char_length(website) <= 200),
  city text check (char_length(city) <= 80),
  address text check (char_length(address) <= 200),
  blurb text check (char_length(blurb) <= 600),
  -- pending_payment → pending_approval (paid) → active (approved) / declined; active → inactive (paused or lapsed)
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'pending_approval', 'active', 'inactive', 'declined')),
  amount_cents int check (amount_cents >= 0),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  approved_at timestamptz,
  period_end timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.repair_partners enable row level security;
drop policy if exists "partners see own record" on public.repair_partners;
create policy "partners see own record" on public.repair_partners for select
  using (user_id = auth.uid() or public.is_admin());
drop trigger if exists repair_partners_updated_at on public.repair_partners;
create trigger repair_partners_updated_at before update on public.repair_partners
  for each row execute function public.set_updated_at();

-- One row per (request, invited partner): the invitation, the partner's quote, and the job once chosen.
create table if not exists public.repair_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  partner_id uuid not null references public.repair_partners(id) on delete cascade,
  status text not null default 'invited'
    check (status in ('invited', 'quoted', 'declined', 'selected', 'not_selected', 'cancelled')),
  price_cents int check (price_cents between 100 and 10000000),
  includes text check (char_length(includes) <= 2000),
  turnaround text check (char_length(turnaround) <= 120),
  warranty text check (char_length(warranty) <= 120),
  dropoff boolean not null default false,
  notes text check (char_length(notes) <= 2000),
  quoted_at timestamptz,
  selected_at timestamptz,
  -- After selection: the workshop's progress, and RIHOSO's referral fee (included in the price).
  job_status text check (job_status in ('accepted', 'received', 'in_progress', 'complete')),
  fee_cents int check (fee_cents >= 0),
  fee_paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, partner_id)
);
create index if not exists repair_quotes_partner_idx on public.repair_quotes (partner_id, created_at desc);
create index if not exists repair_quotes_request_idx on public.repair_quotes (request_id);
-- A request has at most one chosen workshop.
create unique index if not exists repair_quotes_one_selected
  on public.repair_quotes (request_id) where status = 'selected';
alter table public.repair_quotes enable row level security;
drop policy if exists "partners and requesters see quotes" on public.repair_quotes;
create policy "partners and requesters see quotes" on public.repair_quotes for select
  using (
    public.is_admin()
    or exists (select 1 from public.repair_partners p where p.id = partner_id and p.user_id = auth.uid())
    or exists (select 1 from public.service_requests r where r.id = request_id and r.requester_id = auth.uid())
  );
drop trigger if exists repair_quotes_updated_at on public.repair_quotes;
create trigger repair_quotes_updated_at before update on public.repair_quotes
  for each row execute function public.set_updated_at();

-- Requests sent to partners carry a quote-by time (48 hours) for the workshops.
alter table public.service_requests
  add column if not exists partner_mode boolean not null default false,
  add column if not exists quotes_due_at timestamptz;
