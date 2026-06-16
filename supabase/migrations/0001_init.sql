-- Vorrat-LookUp - initial schema
-- Runs inside the shared Supabase project (ggaiorygjkjhbfkvrfmb).
-- Everything lives in an isolated `vorrat` schema so it never touches the
-- existing intelligence tables in `public`.

create schema if not exists vorrat;

-- Roles need access to the new schema (RLS still applies on top).
grant usage on schema vorrat to anon, authenticated, service_role;
alter default privileges in schema vorrat
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema vorrat
  grant all on sequences to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists vorrat.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists vorrat.items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category_id   uuid references vorrat.categories(id) on delete set null,
  unit          text not null default 'Stück',   -- Stück, kg, l, Packung ...
  barcode       text,                              -- EAN, optional (phase 2 scan)
  target_stock  numeric not null default 0,        -- minimum stock we want to keep
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One row per batch/lot, so we can track FIFO rotation and individual expiry.
create table if not exists vorrat.stock_entries (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references vorrat.items(id) on delete cascade,
  quantity    numeric not null check (quantity >= 0),
  expiry_date date,                                -- optional
  location    text,                                -- Keller, Garage, Speisekammer ...
  opened      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Consumption history (phase 2, table created up front).
create table if not exists vorrat.consumption_log (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references vorrat.items(id) on delete cascade,
  quantity    numeric not null,
  consumed_at timestamptz not null default now()
);

create index if not exists idx_vorrat_items_category on vorrat.items(category_id);
create index if not exists idx_vorrat_stock_item     on vorrat.stock_entries(item_id);
create index if not exists idx_vorrat_stock_expiry   on vorrat.stock_entries(expiry_date);

-- ---------------------------------------------------------------------------
-- View: current stock + status per item (security_invoker so RLS applies)
-- ---------------------------------------------------------------------------

create or replace view vorrat.item_overview
with (security_invoker = true) as
select
  i.id,
  i.name,
  i.category_id,
  i.unit,
  i.target_stock,
  coalesce(sum(s.quantity), 0)                                          as current_stock,
  min(s.expiry_date) filter (where s.expiry_date is not null)           as next_expiry,
  greatest(i.target_stock - coalesce(sum(s.quantity), 0), 0)            as to_buy
from vorrat.items i
left join vorrat.stock_entries s on s.item_id = i.id
group by i.id;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- MVP model: one shared household. Any authenticated user has full access,
-- anonymous users have none. Tighten per-household later if needed.
-- ---------------------------------------------------------------------------

alter table vorrat.categories      enable row level security;
alter table vorrat.items           enable row level security;
alter table vorrat.stock_entries   enable row level security;
alter table vorrat.consumption_log enable row level security;

create policy "household full access" on vorrat.categories
  for all to authenticated using (true) with check (true);
create policy "household full access" on vorrat.items
  for all to authenticated using (true) with check (true);
create policy "household full access" on vorrat.stock_entries
  for all to authenticated using (true) with check (true);
create policy "household full access" on vorrat.consumption_log
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed: default categories
-- ---------------------------------------------------------------------------

insert into vorrat.categories (name, icon, sort_order) values
  ('Lebensmittel',      '🥫', 10),
  ('Wasser',            '💧', 20),
  ('Hygiene',           '🧼', 30),
  ('Medizin & Erste Hilfe', '💊', 40),
  ('Energie (Strom/Holz)',  '🔋', 50),
  ('Garten & Saatgut',  '🌱', 60),
  ('Sonstiges',         '📦', 70)
on conflict do nothing;
