-- The RIHOSO Monthly: a members-only newsletter.
-- The monthly writing task saves each issue as a draft through POST /api/newsletter (token-protected).
-- Brandon reviews it at /marketplace/admin/newsletter, adds photos, and approves it.
-- The daily cron emails members a teaser on the issue date (the 1st) once it is approved;
-- the full issue is read on rihoso.com/newsletter by signed-in members.

create table if not exists public.newsletters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[0-9]{4}-[0-9]{2}$'),
  issue_date date not null unique,
  title text not null check (char_length(title) between 5 and 140),
  intro text not null default '' check (char_length(intro) <= 1200),
  sections jsonb not null default '[]'::jsonb check (jsonb_typeof(sections) = 'array'),
  status text not null default 'draft' check (status in ('draft', 'approved', 'sending', 'sent', 'cancelled')),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz,
  campaign_id uuid references public.email_campaigns(id) on delete set null,
  created_by text not null default 'admin' check (created_by in ('admin', 'writer')),
  edited_at timestamptz,
  notified_at timestamptz,
  nudged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists newsletters_issue_idx on public.newsletters (issue_date desc);

drop trigger if exists newsletters_updated_at on public.newsletters;
create trigger newsletters_updated_at before update on public.newsletters
  for each row execute function public.set_updated_at();

-- All reads for members and all writes go through the server (service role); admins may read directly.
alter table public.newsletters enable row level security;
drop policy if exists "admins read newsletters" on public.newsletters;
create policy "admins read newsletters" on public.newsletters for select using (public.is_admin());
revoke insert, update, delete on public.newsletters from anon, authenticated;

-- Newsletter photos (local store, RIHOSO event). Public URLs with random names; only admins upload or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('newsletter-photos', 'newsletter-photos', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "admins upload newsletter photos" on storage.objects;
create policy "admins upload newsletter photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'newsletter-photos' and public.is_admin());
drop policy if exists "admins delete newsletter photos" on storage.objects;
create policy "admins delete newsletter photos" on storage.objects for delete to authenticated
  using (bucket_id = 'newsletter-photos' and public.is_admin());
