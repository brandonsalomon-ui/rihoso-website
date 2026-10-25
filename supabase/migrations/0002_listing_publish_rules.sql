-- Listings must meet the Watch Exchange publishing rules before going live:
-- a reference number, a real description, and at least 3 photos.
create or replace function public.listings_before_write()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    if coalesce(trim(new.reference), '') = '' then
      raise exception 'A reference number is required to publish.' using errcode = 'check_violation';
    end if;
    if char_length(trim(new.description)) < 80 then
      raise exception 'A description of at least a couple of sentences is required to publish.' using errcode = 'check_violation';
    end if;
    if (select count(*) from public.listing_photos p where p.listing_id = new.id) < 3 then
      raise exception 'At least 3 photos are required to publish.' using errcode = 'check_violation';
    end if;
  end if;
  if new.status = 'active' and new.published_at is null then
    new.published_at = now();
  end if;
  new.updated_at = now();
  return new;
end $$;
