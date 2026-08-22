-- ============================================================================
--  GORB backend schema (Supabase / Postgres)
--  Paste the whole file into  Supabase → SQL Editor → New query → Run.
--  Safe to run more than once (idempotent).
--
--  What it creates:
--    gorb_gallery   drawings saved from Gorb Paint (+ a vote function)
--    gorb_chat      messages in The Pond (Gorb Messenger)
--    gorb_presence  who is online right now (+ an online-count function)
--
--  Everything is readable and writable by the public "anon" role, but every
--  write is guarded (size limits, no posting as a bot, votes only go +1).
--  Nothing here needs the service_role key. The frontend uses the anon key.
-- ============================================================================

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- GALLERY  (drawings from Gorb Paint)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gorb_gallery (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'anon',
  image      text not null,              -- PNG data URL (base64)
  votes      int  not null default 0,
  owner_who  text,                       -- anonymous client id
  created_at timestamptz not null default now()
);

alter table public.gorb_gallery enable row level security;

drop policy if exists gorb_gallery_read   on public.gorb_gallery;
drop policy if exists gorb_gallery_insert on public.gorb_gallery;

create policy gorb_gallery_read on public.gorb_gallery
  for select using (true);

create policy gorb_gallery_insert on public.gorb_gallery
  for insert with check (
        char_length(coalesce(name, '')) <= 40
    and image like 'data:image/png%'
    and char_length(image) <= 400000          -- ~300 KB, keeps rows sane
  );

-- votes can only ever go up by one, so voting is an RPC, not a raw UPDATE
create or replace function public.gorb_gallery_vote(row_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.gorb_gallery set votes = votes + 1 where id = row_id;
$$;

-- ─────────────────────────────────────────────────────────────
-- CHAT  (The Pond)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gorb_chat (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nick       text not null default 'anon',
  body       text,
  who        text,                        -- anonymous client id
  image      text,                        -- optional PNG data URL
  is_bot     boolean not null default false
);

alter table public.gorb_chat enable row level security;

drop policy if exists gorb_chat_read   on public.gorb_chat;
drop policy if exists gorb_chat_insert on public.gorb_chat;

create policy gorb_chat_read on public.gorb_chat
  for select using (true);

create policy gorb_chat_insert on public.gorb_chat
  for insert with check (
        char_length(coalesce(nick, '')) <= 24
    and char_length(coalesce(body, '')) <= 500
    and is_bot = false                        -- anons cannot post as the bot
    and (image is null or char_length(image) <= 400000)
    and (coalesce(body, '') <> '' or image is not null)
  );

-- ─────────────────────────────────────────────────────────────
-- PRESENCE  (who is online)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gorb_presence (
  who       text primary key,
  nick      text,
  last_seen timestamptz not null default now()
);

alter table public.gorb_presence enable row level security;

drop policy if exists gorb_presence_read   on public.gorb_presence;
drop policy if exists gorb_presence_insert on public.gorb_presence;
drop policy if exists gorb_presence_update on public.gorb_presence;

create policy gorb_presence_read on public.gorb_presence
  for select using (true);

create policy gorb_presence_insert on public.gorb_presence
  for insert with check (char_length(coalesce(who, '')) between 1 and 64);

create policy gorb_presence_update on public.gorb_presence
  for update using (true) with check (true);

-- how many clients checked in during the last 30 seconds
create or replace function public.gorb_online()
returns int
language sql
stable
set search_path = public
as $$
  select count(*)::int
  from public.gorb_presence
  where last_seen > now() - interval '30 seconds';
$$;

-- ─────────────────────────────────────────────────────────────
-- GRANTS  (the anon role is what the frontend uses)
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to anon;
grant select, insert on public.gorb_gallery  to anon;
grant select, insert on public.gorb_chat     to anon;
grant select, insert, update on public.gorb_presence to anon;
grant execute on function public.gorb_gallery_vote(uuid) to anon;
grant execute on function public.gorb_online() to anon;

-- optional: expose these tables to PostgREST realtime (live chat/gallery)
-- alter publication supabase_realtime add table public.gorb_chat;
-- alter publication supabase_realtime add table public.gorb_gallery;

-- ─────────────────────────────────────────────────────────────
-- SHOP ORDERS  (Gorb Shop checkout)
-- Insert-only for the public: nobody can read anyone else's order via the
-- anon key. Read your orders in the dashboard (Table editor → gorb_orders).
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gorb_orders (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  who        text,
  name       text not null,
  email      text not null,
  address    text not null,
  items      jsonb not null,               -- [{ id, title, price, qty }]
  total      numeric(10,2) not null,
  status     text not null default 'new'
);

alter table public.gorb_orders enable row level security;

drop policy if exists gorb_orders_insert on public.gorb_orders;

create policy gorb_orders_insert on public.gorb_orders
  for insert with check (
        char_length(coalesce(name, ''))    between 1 and 80
    and char_length(coalesce(email, ''))   between 3 and 120
    and char_length(coalesce(address, '')) between 1 and 300
    and total >= 0
    and jsonb_typeof(items) = 'array'
  );

grant insert on public.gorb_orders to anon;

-- ─────────────────────────────────────────────────────────────
-- NFT MINTS  (Gorb NFT Mint, Solana devnet)
-- The actual mint happens on-chain via a Candy Machine guard; this table is
-- just our own record of it. Readable so a wallet can see its past mints.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gorb_nft_mints (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  who          text,                        -- anonymous client id
  wallet       text not null,               -- buyer's Solana wallet address
  product_id   text not null,               -- PRODUCTS[].id
  mint_address text not null,               -- the minted Core asset address
  tx_sig       text not null                -- devnet transaction signature
);

alter table public.gorb_nft_mints enable row level security;

drop policy if exists gorb_nft_mints_read   on public.gorb_nft_mints;
drop policy if exists gorb_nft_mints_insert on public.gorb_nft_mints;

create policy gorb_nft_mints_read on public.gorb_nft_mints
  for select using (true);

create policy gorb_nft_mints_insert on public.gorb_nft_mints
  for insert with check (
        char_length(wallet)       between 32 and 64
    and char_length(product_id)   between 1  and 40
    and char_length(mint_address) between 32 and 64
    and char_length(tx_sig)       between 32 and 128
  );

grant select, insert on public.gorb_nft_mints to anon;
