-- ============================================================
-- The Moon Estate — Supabase setup
-- Run this in your Supabase project: SQL Editor → New query → Run
-- (Safe to re-run; it drops & recreates policies.)
-- ============================================================

-- 1) LISTINGS — every property as a JSON document
create table if not exists public.listings (
  id          text primary key,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists listings_created_at_idx on public.listings (created_at desc);
alter table public.listings enable row level security;

drop policy if exists "public read listings"   on public.listings;
drop policy if exists "public insert listings" on public.listings;
drop policy if exists "public delete listings" on public.listings;
drop policy if exists "auth delete listings"   on public.listings;

-- anyone can browse + post a property
create policy "public read listings"   on public.listings for select using (true);
create policy "public insert listings" on public.listings for insert with check (true);
-- ONLY a logged-in admin can delete (secure)
create policy "auth delete listings"   on public.listings for delete using (auth.role() = 'authenticated');

-- 2) LEADS — buyer enquiries (name, phone, which property)
create table if not exists public.leads (
  id          text primary key,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
alter table public.leads enable row level security;

drop policy if exists "public insert leads" on public.leads;
drop policy if exists "auth read leads"     on public.leads;
drop policy if exists "auth delete leads"   on public.leads;

-- anyone can submit an enquiry...
create policy "public insert leads" on public.leads for insert with check (true);
-- ...but only the logged-in admin can read/delete them (keeps customer data private)
create policy "auth read leads"     on public.leads for select using (auth.role() = 'authenticated');
create policy "auth delete leads"   on public.leads for delete using (auth.role() = 'authenticated');

-- ============================================================
-- 3) Create your ADMIN login:
--    Supabase dashboard → Authentication → Users → "Add user"
--    Enter your email + a strong password, then tick
--    "Auto Confirm User". Use those to log in via the site's
--    footer → Admin.
-- ============================================================
