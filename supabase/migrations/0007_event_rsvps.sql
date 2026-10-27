-- RSVPs for RIHOSO events (e.g. the Nov 24, 2026 meet-up at Capriccio).
-- Written only by the server (/api/events/rsvp) with the service-role key; RIHOSO admins can read them.
-- One row per person per event: a second RSVP from the same email updates the first.

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null check (char_length(event_slug) between 1 and 80),
  full_name text not null check (char_length(full_name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 200 and email = lower(email)),
  phone text check (char_length(phone) <= 40),
  says_member boolean not null default false,        -- what the person ticked on the form
  member_verified boolean not null default false,    -- their email belongs to a verified RIHOSO member
  guests smallint not null default 0 check (guests between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_slug, email)
);

create index event_rsvps_event_idx on public.event_rsvps (event_slug, created_at);

alter table public.event_rsvps enable row level security;
create policy "admins see rsvps" on public.event_rsvps for select using (public.is_admin());
revoke insert, update, delete on public.event_rsvps from anon, authenticated;

create trigger event_rsvps_updated_at before update on public.event_rsvps
  for each row execute function public.set_updated_at();
