-- Member email: announcements Brandon sends from the admin Members page (/marketplace/admin/members).
-- email_campaigns   — one row per announcement sent (the "sent log")
-- email_deliveries  — one row per person it went to, with Resend's result
-- email_unsubscribes — people who clicked "unsubscribe"; they are skipped on every future announcement
-- All writes happen on the server with the service-role key; only RIHOSO admins can read.

create table public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(subject) between 1 and 200),
  body text not null check (char_length(body) between 1 and 20000),
  cta_label text check (char_length(cta_label) <= 60),
  cta_url text check (char_length(cta_url) <= 500),
  audience text not null check (char_length(audience) between 1 and 80),
  audience_label text not null check (char_length(audience_label) between 1 and 200),
  sent_by uuid references auth.users(id) on delete set null,
  recipient_count int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  skipped_unsubscribed int not null default 0,
  status text not null default 'sending' check (status in ('sending', 'sent', 'partial', 'failed')),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index email_campaigns_created_idx on public.email_campaigns (created_at desc);

create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  email text not null check (char_length(email) between 3 and 200 and email = lower(email)),
  name text check (char_length(name) <= 120),
  resend_id text,
  error text check (char_length(error) <= 500),
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);
create index email_deliveries_campaign_idx on public.email_deliveries (campaign_id);

create table public.email_unsubscribes (
  email text primary key check (char_length(email) between 3 and 200 and email = lower(email)),
  unsubscribed_at timestamptz not null default now()
);

alter table public.email_campaigns enable row level security;
alter table public.email_deliveries enable row level security;
alter table public.email_unsubscribes enable row level security;
create policy "admins read campaigns" on public.email_campaigns for select using (public.is_admin());
create policy "admins read deliveries" on public.email_deliveries for select using (public.is_admin());
create policy "admins read unsubscribes" on public.email_unsubscribes for select using (public.is_admin());
revoke insert, update, delete on public.email_campaigns from anon, authenticated;
revoke insert, update, delete on public.email_deliveries from anon, authenticated;
revoke insert, update, delete on public.email_unsubscribes from anon, authenticated;
