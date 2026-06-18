-- ============================================================
-- The Moon Estate — Supabase setup
-- Run this in your Supabase project: SQL Editor → New query → Run
-- (Safe to re-run; it drops & recreates policies.)
--
-- NOTE: replace the admin email below if yours is different.
-- ============================================================

-- 1) LISTINGS — every property as a JSON document (data->>'ownerUid' = poster's id)
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
drop policy if exists "auth insert listings"   on public.listings;
drop policy if exists "owner or admin delete"  on public.listings;
drop policy if exists "owner or admin update"  on public.listings;

-- anyone can browse
create policy "public read listings" on public.listings for select using (true);
-- only logged-in users can post (stops anonymous spam)
create policy "auth insert listings" on public.listings for insert
  with check (auth.role() = 'authenticated');
-- a user can EDIT only their OWN listing; the admin can edit any
create policy "owner or admin update" on public.listings for update using (
  (data->>'ownerUid') = auth.uid()::text
  or auth.jwt()->>'email' = 'lucky05290@gmail.com'
) with check (
  (data->>'ownerUid') = auth.uid()::text
  or auth.jwt()->>'email' = 'lucky05290@gmail.com'
);
-- a user can DELETE only their OWN listing; the admin can delete any
create policy "owner or admin delete" on public.listings for delete using (
  (data->>'ownerUid') = auth.uid()::text
  or auth.jwt()->>'email' = 'lucky05290@gmail.com'
);

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
drop policy if exists "admin read leads"    on public.leads;
drop policy if exists "admin delete leads"  on public.leads;

-- anyone (even not logged in) can submit an enquiry...
create policy "public insert leads" on public.leads for insert with check (true);
-- ...but only the ADMIN can read / delete them (keeps customer data private)
create policy "admin read leads"   on public.leads for select
  using (auth.jwt()->>'email' = 'lucky05290@gmail.com');
create policy "admin delete leads" on public.leads for delete
  using (auth.jwt()->>'email' = 'lucky05290@gmail.com');

-- ============================================================
-- 3) Logins:
--    • Your ADMIN user: Authentication → Users → Add user
--      (email = the one above, tick "Auto Confirm User").
--    • Visitors create their own accounts from the site's "Login" button.
--
-- TIP for smooth signup (optional): Authentication → Providers → Email →
--   turn OFF "Confirm email" so new users can log in instantly without
--   clicking an email link.
-- ============================================================
