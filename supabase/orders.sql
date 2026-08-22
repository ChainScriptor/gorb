-- ============================================================================
--  GORB SHOP orders  (run this in Supabase → SQL Editor, after schema.sql)
--  Safe to run more than once.
--
--  Customers can only INSERT orders. There is deliberately no public SELECT,
--  so nobody can read anyone else's order through the anon key. You read the
--  orders yourself in the Supabase dashboard (Table editor → gorb_orders).
-- ============================================================================

create table if not exists public.gorb_orders (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  who        text,                 -- anonymous client id
  name       text not null,
  email      text not null,
  address    text not null,
  items      jsonb not null,       -- [{ id, title, price, qty }]
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

-- anon may insert only (no select/update/delete policy = blocked)
grant usage on schema public to anon;
grant insert on public.gorb_orders to anon;
