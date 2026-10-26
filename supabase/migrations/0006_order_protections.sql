-- RIHOSO Watch Exchange — buyer protections from the revised terms (Oct 26, 2026):
--  * 72-hour inspection starts at VERIFIED receipt (buyer confirms, or RIHOSO verifies tracking)
--  * local pickup releases only after a confirmed handover; unpicked orders are cancelled after 7 days
--  * seller ships within 3 business days, or the buyer may cancel for a full refund
--  * written decisions on problems, approved returns, partial refunds
--  * dues refunds, and a record of who accepted which policy version

alter table public.orders
  add column if not exists paid_at timestamptz,
  add column if not exists ship_by timestamptz,
  add column if not exists ship_overdue_notified_at timestamptz,
  add column if not exists pickup_deadline timestamptz,
  add column if not exists delivery_reported_at timestamptz,
  add column if not exists receipt_verified_by text check (receipt_verified_by in ('buyer', 'admin')),
  add column if not exists handover_reported_at timestamptz,
  add column if not exists decision_note text check (char_length(decision_note) <= 4000),
  add column if not exists decided_at timestamptz,
  add column if not exists return_approved_at timestamptz,
  add column if not exists return_carrier text check (char_length(return_carrier) <= 40),
  add column if not exists return_tracking text check (char_length(return_tracking) <= 80),
  add column if not exists return_shipped_at timestamptz,
  add column if not exists return_received_at timestamptz,
  add column if not exists return_problem text check (char_length(return_problem) <= 4000),
  add column if not exists return_problem_at timestamptz,
  add column if not exists refunded_amount_cents int not null default 0 check (refunded_amount_cents >= 0);

update public.orders set paid_at = created_at where paid_at is null and status <> 'pending_payment';

create index if not exists orders_ship_by_idx on public.orders (ship_by) where status = 'paid_held';
create index if not exists orders_pickup_deadline_idx on public.orders (pickup_deadline) where status = 'paid_held';

alter table public.memberships add column if not exists refunded_at timestamptz;

-- Who accepted which version of which policy, and where.
create table if not exists public.policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  policy text not null check (policy in ('terms', 'privacy', 'seller', 'membership')),
  version text not null check (char_length(version) between 1 and 40),
  context text not null check (context in ('signup', 'seller_signup', 'checkout', 'membership')),
  order_id uuid references public.orders(id) on delete set null,
  membership_id uuid references public.memberships(id) on delete set null,
  user_agent text check (char_length(user_agent) <= 300),
  accepted_at timestamptz not null default now()
);
create index if not exists policy_acceptances_user_idx on public.policy_acceptances (user_id, policy, accepted_at desc);
alter table public.policy_acceptances enable row level security;
drop policy if exists "people see own acceptances" on public.policy_acceptances;
create policy "people see own acceptances" on public.policy_acceptances for select
  using (user_id = auth.uid() or public.is_admin());
revoke insert, update, delete on public.policy_acceptances from anon, authenticated;

-- New accounts: record acceptance of the Terms of Use and Privacy Policy ticked on the sign-in form.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  terms_v text := left(nullif(trim(new.raw_user_meta_data->>'terms_version'), ''), 40);
  privacy_v text := left(nullif(trim(new.raw_user_meta_data->>'privacy_version'), ''), 40);
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    -- never derive a public name from the email address
    coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'), 80), ''), 'Collector')
  )
  on conflict (id) do nothing;
  if terms_v is not null then
    insert into public.policy_acceptances (user_id, policy, version, context) values (new.id, 'terms', terms_v, 'signup');
  end if;
  if privacy_v is not null then
    insert into public.policy_acceptances (user_id, policy, version, context) values (new.id, 'privacy', privacy_v, 'signup');
  end if;
  return new;
end $$;
