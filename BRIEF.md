# RIHOSO Website — Build Brief

## What We're Building
A modern website for the Rhode Island Horological Society (RIHOSO), replacing the current GoDaddy Website Builder site at rihoso.com.

## Tech Stack
- Next.js 14 (App Router)
- Tailwind CSS
- TypeScript
- Vercel deployment ready (vercel.json config included)

## Design Reference
- Primary color: Deep forest green (#1a2e1a or similar dark green)
- Secondary: Gold/cream accents
- Clean, sophisticated — feels like a serious collectors society, not a retail brand
- Reference app: https://global-event-hub.replit.app (see the dark green aesthetic and RIHOSO logo)

## Pages to Build
1. **Home** — Hero with RIHOSO name/tagline, upcoming events preview, news feed section, membership CTA
2. **About RIHOSO** — Mission, history, who we are
3. **Events & Gatherings** — Event listings with dates/locations
4. **Memberships** — Membership tiers, benefits, Stripe payment button (placeholder for now)
5. **Sponsors & Supporters** — Logo grid page
6. **Blog** — Article listing page + individual article page
7. **Watchmaking Schools** — Directory/resource page
8. **Contact** — Simple contact form

## Current Site Content (copy from rihoso.com)
Nav: Home, About RIHOSO, Events and Gatherings, Memberships, Join Now, Contact, Sponsors and Supporters, Blogs, Watchmaking Schools

## News Feed
Live watch news is available via API: https://global-event-hub.replit.app/api/news
Returns JSON array of articles. Display latest 6 on homepage in a news grid.

## Key Requirements
- Fully responsive (mobile-first)
- Fast loading — static where possible, ISR for news feed
- SEO optimized (meta tags, og:image support)
- No auto-publishing — all content managed via files or CMS
- Include vercel.json for easy deployment
- Clean component structure

## Logo
Use text-based logo for now: "RIHOSO" with "Rhode Island Horological Society" subtitle in an elegant serif font. Include a circular emblem placeholder.

## Tagline
"Time, History, Art, Science, Education, and Tradition. Preserving the Legacy of Horology."

When completely finished, run this command to notify Atlas:
openclaw system event --text "Done: RIHOSO website built — Next.js, ready to review at ~/Projects/rihoso-website" --mode now
