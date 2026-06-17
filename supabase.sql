-- ============================================================
-- The Moon Estate — Supabase setup
-- Run this in your Supabase project: SQL Editor → New query → Run
-- ============================================================

-- 1) Table that holds every property listing as a JSON document
create table if not exists public.listings (
  id          text primary key,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists listings_created_at_idx
  on public.listings (created_at desc);

-- 2) Row Level Security
alter table public.listings enable row level security;

-- Anyone can READ listings (public marketplace)
create policy "public read listings"
  on public.listings for select
  using (true);

-- Anyone can POST a listing (no login required, like a quick-post portal)
create policy "public insert listings"
  on public.listings for insert
  with check (true);

-- Allow delete so the in-app Admin panel can remove listings.
-- NOTE: this lets the anon key delete rows. For production, remove
-- this policy and delete only from the Supabase dashboard, or gate
-- deletes behind Supabase Auth.
create policy "public delete listings"
  on public.listings for delete
  using (true);

-- ============================================================
-- Done. Copy your Project URL + anon key into js/config.js
-- ============================================================
