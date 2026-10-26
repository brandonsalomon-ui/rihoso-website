-- RIHOSO blog in the database, so new posts publish without a code release.
-- The weekly writing task publishes through POST /api/blog (token-protected); admins can hide posts.

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 90),
  title text not null check (char_length(title) between 5 and 140),
  excerpt text not null check (char_length(excerpt) between 20 and 320),
  body text not null check (char_length(body) between 400 and 20000),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  topic text check (char_length(topic) <= 120),
  cover text not null default 'dial' check (cover in ('dial', 'pocket', 'pendulum', 'gears')),
  author text not null default 'RIHOSO' check (char_length(author) <= 80),
  status text not null default 'published' check (status in ('published', 'hidden')),
  published_at timestamptz not null default now(),
  created_by text not null default 'admin' check (created_by in ('admin', 'weekly-writer', 'seed')),
  created_at timestamptz not null default now()
);
create index if not exists blog_posts_published_idx on public.blog_posts (published_at desc) where status = 'published';

alter table public.blog_posts enable row level security;
drop policy if exists "published posts are public" on public.blog_posts;
create policy "published posts are public" on public.blog_posts for select
  using (status = 'published' or public.is_admin());
revoke insert, update, delete on public.blog_posts from anon, authenticated;

insert into public.blog_posts (slug, title, excerpt, body, cover, published_at, created_by) values
  ($q$art-of-mechanical-timekeeping$q$, $q$The Art of Mechanical Timekeeping$q$, $q$An exploration of what makes mechanical watches and clocks enduring marvels of engineering and artistry.$q$, $q$Mechanical timekeeping is one of humanity's greatest achievements — a marriage of precision engineering, artistic expression, and scientific understanding that has evolved over centuries.

From the earliest spring-driven clocks of the 15th century to the exquisite tourbillons of today, mechanical timepieces represent far more than a way to tell time. They are miniature universes of interlocking gears, springs, and escapements, each component working in concert to measure the passage of time.

What draws people to mechanical watches and clocks in an age of atomic clocks and smartphones? The answer lies in the tangible connection to craftsmanship. When you hold a mechanical watch, you hold the work of human hands — hours of patient assembly, adjustment, and finishing.

The escapement, the beating heart of any mechanical timepiece, transforms the stored energy of a mainspring into the regulated ticks that mark each second. The balance wheel oscillates back and forth, its rhythm as steady as a heartbeat, governing the march of the hands across the dial.

For members of RIHOSO, the fascination with mechanical timekeeping is both intellectual and emotional. We gather not just to admire these machines, but to understand them — to learn the language of horology and to appreciate the generations of innovation that brought us from sundials to marine chronometers, from tower clocks to wristwatch movements thinner than a coin.$q$, $q$dial$q$, ('2026-02-15'::date + time '12:00')::timestamptz, 'seed'),
  ($q$new-england-clockmaking-heritage$q$, $q$New England's Clockmaking Heritage$q$, $q$From the earliest colonial clockmakers to industrial-era factories, New England shaped American horology.$q$, $q$New England holds a special place in the history of American horology. From the colonial era through the industrial revolution, this region was the beating heart of clockmaking in the United States.

The story begins with early craftsmen like Benjamin Banneker and Eli Terry, whose innovations transformed clockmaking from an exclusive luxury into something accessible to ordinary American households. Terry's development of interchangeable parts for clock movements in the early 1800s was revolutionary — a precursor to the mass manufacturing techniques that would define American industry.

Connecticut's "Clock Valley" became the center of American clock production, with firms like Seth Thomas, Ansonia, and New Haven Clock Company producing millions of timepieces. Rhode Island, too, played its role, with skilled craftsmen and small workshops contributing to the region's horological output.

The legacy of New England clockmaking extends beyond the physical timepieces. It established traditions of precision manufacturing, apprenticeship, and craftsmanship that continue to influence American horology today.

At RIHOSO, we celebrate this heritage through education, preservation, and community. Many of our members are custodians of New England-made clocks and watches, keeping these pieces of American history alive and ticking.$q$, $q$pendulum$q$, ('2026-01-20'::date + time '12:00')::timestamptz, 'seed'),
  ($q$getting-started-with-watch-collecting$q$, $q$Getting Started with Watch Collecting$q$, $q$A beginner's guide to building a meaningful watch collection — what to look for, where to start, and how to learn.$q$, $q$Watch collecting is a deeply personal pursuit. There is no single right way to build a collection — it should reflect your interests, your curiosity, and your connection to the art of timekeeping.

For beginners, the world of watches can seem overwhelming. Thousands of brands, countless complications, and a vocabulary all its own. But every collector started somewhere, and the best advice is simple: buy what speaks to you.

Start by handling watches whenever possible. Visit local watch shops, attend horological fairs (like those hosted by RIHOSO), and connect with collectors who are happy to share their knowledge and let you examine their pieces.

Learn the basics: understand the difference between manual-wind and automatic movements, know what a complication is, and familiarize yourself with the major watchmaking houses and their histories.

Set a budget and stick to it. Some of the most interesting and historically significant watches are surprisingly affordable. Vintage Soviet watches, mid-century American pieces, and Japanese mechanical watches all offer excellent entry points for new collectors.

Most importantly, join a community. Organizations like RIHOSO provide invaluable opportunities to learn from experienced collectors, discover pieces you might never encounter on your own, and share the joy of horology with like-minded enthusiasts.$q$, $q$pocket$q$, ('2025-12-10'::date + time '12:00')::timestamptz, 'seed'),
  ($q$restoring-antique-clocks$q$, $q$Restoring Antique Clocks: A Labor of Love$q$, $q$Members share their experiences bringing centuries-old timepieces back to life, one gear at a time.$q$, $q$There is something deeply satisfying about bringing an antique clock back to life. A timepiece that has been silent for decades — perhaps centuries — begins to tick again, its pendulum swinging, its hands marking the hours as they were meant to.

Clock restoration is equal parts detective work, engineering, and artistry. It begins with careful examination: understanding the movement, identifying missing or damaged parts, and researching the clock's history and original specifications.

The first rule of restoration is to do no harm. Wherever possible, original parts should be preserved and repaired rather than replaced. The patina of age — the gentle wear on brass, the darkening of steel — tells the story of the clock's life and should be respected.

Cleaning is perhaps the most critical step. Years of dust, dried oil, and oxidation can bring a movement to a standstill. Careful disassembly, ultrasonic cleaning, and re-oiling with appropriate lubricants can work wonders.

Our members at RIHOSO have collectively restored hundreds of clocks, from simple mantel clocks to complex tower clock movements. We share our techniques, our discoveries, and our mistakes — because in restoration, as in horology itself, there is always more to learn.$q$, $q$gears$q$, ('2025-11-05'::date + time '12:00')::timestamptz, 'seed')
on conflict (slug) do nothing;
