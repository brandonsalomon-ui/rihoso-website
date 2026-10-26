-- RIHOSO memberships paid online: $120 for 12 months, no automatic renewal.
-- A paid membership sets profiles.is_member (5% Exchange fee); the daily job clears it when the term ends.
-- Members approved by hand (paid offline) have no rows here and are never expired automatically.

create type public.membership_status as enum ('pending', 'paid', 'refunded');

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text check (char_length(phone) <= 40),
  amount_cents int not null check (amount_cents > 0),
  status public.membership_status not null default 'pending',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'paid' or (period_start is not null and period_end is not null and period_end > period_start))
);

create index memberships_user_idx on public.memberships (user_id, period_end desc);
create index memberships_paid_end_idx on public.memberships (period_end) where status = 'paid';

alter table public.memberships enable row level security;
-- Members see their own memberships; RIHOSO admins see all. All writes happen on the server.
create policy "members see own memberships" on public.memberships for select
  using (user_id = auth.uid() or public.is_admin());

create trigger memberships_updated_at before update on public.memberships
  for each row execute function public.set_updated_at();

-- Belt and braces: members can read their rows but never write them directly.
revoke insert, update, delete on public.memberships from anon, authenticated;
