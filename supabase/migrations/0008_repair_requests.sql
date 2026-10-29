-- Repair requests: watch details, photos and how the customer wants to be contacted.
-- Additive only: existing service requests keep working unchanged.

alter table public.service_requests
  add column if not exists contact_name text check (char_length(contact_name) <= 120),
  add column if not exists contact_phone text check (char_length(contact_phone) <= 40),
  add column if not exists contact_method text check (contact_method in ('email', 'phone', 'text')),
  add column if not exists watch_brand text check (char_length(watch_brand) <= 60),
  add column if not exists watch_model text check (char_length(watch_model) <= 80),
  add column if not exists watch_reference text check (char_length(watch_reference) <= 60),
  add column if not exists watch_year int check (watch_year between 1700 and 2100),
  add column if not exists photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 8);

-- A phone number is required when the customer asks for a call or text.
alter table public.service_requests drop constraint if exists service_requests_phone_for_calls;
alter table public.service_requests add constraint service_requests_phone_for_calls
  check (contact_method is null or contact_method = 'email' or coalesce(char_length(contact_phone), 0) >= 7);

-- Private bucket: repair photos are only seen by the customer and RIHOSO (served through short-lived signed links).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('repair-photos', 'repair-photos', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

drop policy if exists "users upload own repair photos" on storage.objects;
create policy "users upload own repair photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'repair-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users delete own repair photos" on storage.objects;
create policy "users delete own repair photos" on storage.objects for delete to authenticated
  using (bucket_id = 'repair-photos' and (storage.foldername(name))[1] = auth.uid()::text);
