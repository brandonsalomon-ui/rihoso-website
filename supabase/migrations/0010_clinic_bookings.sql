-- Watchmaking Clinic bookings paid online.
-- Pricing (enforced on the server): $75 per seat, $50 per seat for a verified RIHOSO member, 4-seat minimum.
-- Guests without a name yet are "TBD" and pay the standard rate.
-- clinic_bookings      — one row per booking (pending until Stripe confirms payment)
-- clinic_member_codes  — 6-digit codes emailed to a member guest to prove the member rate applies to them
-- All reads and writes happen on the server with the service-role key; only RIHOSO admins can read.

create table public.clinic_bookings (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200),
  phone text not null check (char_length(phone) between 7 and 40),
  location text not null check (char_length(location) between 1 and 300),
  location_notes text check (char_length(location_notes) <= 2000),
  occasion text check (occasion in ('anniversary', 'birthday', 'graduation', 'work_event', 'holiday_gift', 'other')),
  occasion_details text check (char_length(occasion_details) <= 500),
  notes text check (char_length(notes) <= 3000),
  -- [{ "name": "Jane Smith" | "TBD", "member": true|false, "member_email": "..." | null, "price_cents": 5000|7500 }]
  guests jsonb not null check (jsonb_typeof(guests) = 'array' and jsonb_array_length(guests) >= 4),
  seats int not null check (seats >= 4),
  member_seats int not null default 0 check (member_seats >= 0 and member_seats <= seats),
  amount_cents int not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index clinic_bookings_created_idx on public.clinic_bookings (created_at desc);

alter table public.clinic_bookings enable row level security;
create policy "admins read clinic bookings" on public.clinic_bookings for select using (public.is_admin());
create trigger clinic_bookings_updated_at before update on public.clinic_bookings
  for each row execute function public.set_updated_at();
revoke insert, update, delete on public.clinic_bookings from anon, authenticated;

create table public.clinic_member_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 200 and email = lower(email)),
  code_hash text not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index clinic_member_codes_email_idx on public.clinic_member_codes (email, created_at desc);
create index clinic_member_codes_created_idx on public.clinic_member_codes (created_at desc);

alter table public.clinic_member_codes enable row level security;
-- No policies: only the server (service role) touches codes.
revoke all on public.clinic_member_codes from anon, authenticated;

-- Is this email a current RIHOSO member? (approved by hand, or a paid online term that hasn't ended)
create or replace function public.is_member_email(p_email text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.profiles p on p.id = u.id
    where lower(u.email) = lower(trim(p_email))
      and (
        p.is_member
        or exists (
          select 1 from public.memberships m
          where m.user_id = u.id and m.status = 'paid' and m.period_end > now()
        )
      )
  )
$$;
revoke all on function public.is_member_email(text) from public, anon, authenticated;
grant execute on function public.is_member_email(text) to service_role;
