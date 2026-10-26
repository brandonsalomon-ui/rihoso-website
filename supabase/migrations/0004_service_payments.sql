-- Payments for member validations ($100, paid up front) and repair quotes (paid after RIHOSO quotes).
alter table public.service_requests
  add column if not exists stripe_payment_intent_id text unique,
  add column if not exists paid_at timestamptz,
  add column if not exists refunded_at timestamptz;

-- Only one paid/active validation per listing
create unique index if not exists service_requests_one_validation_per_listing
  on public.service_requests (listing_id)
  where type = 'validation' and status in ('paid', 'in_progress');
