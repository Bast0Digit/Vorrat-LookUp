-- Vorrat-LookUp - DB schema REFERENCE.
-- This is ALREADY APPLIED to the shared Supabase project in the `vorrat` schema,
-- and `vorrat` is exposed to the API. Do NOT re-run this; it documents what exists.
-- Generate types from the live schema; the v2 columns are NOT auto-generatable
-- (the generator only emits `public`), so keep src/lib/supabase/types.ts in sync by
-- hand. For schema CHANGES, add a new migration under supabase/migrations/.
--
-- v2 (2026-06): packaging/units model, per-person reach, household settings,
-- consumption logging. See migrations 0001 + 0002 and docs/CHANGE-REQUEST-2026-06.md.

create schema if not exists vorrat;
grant usage on schema vorrat to anon, authenticated, service_role;

create table vorrat.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  icon        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table vorrat.items (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  category_id          uuid references vorrat.categories(id) on delete set null,
  unit                 text not null default 'Stück',   -- count/pack unit (Stück/Packung/Flasche/Ster ...)
  barcode              text,
  target_stock         numeric not null default 0,      -- minimum we want to keep, in `unit` (packs/count)
  notes                text,
  -- v2 packaging + reach:
  pack_size            numeric not null default 1,       -- content per pack, in base_unit (e.g. 500)
  base_unit            text,                             -- g | ml | l | kg | Ster | kWh ... (null = count only)
  daily_use_per_person numeric,                          -- base_unit per person per day (null = no reach)
  is_asset             boolean not null default false,   -- PV/solar/battery: no expiry, no reach, no re-buy
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table vorrat.stock_entries (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references vorrat.items(id) on delete cascade,
  quantity    numeric not null check (quantity >= 0),  -- number of packs/count for this lot
  expiry_date date,                                    -- one shared MHD per lot (many packs, one date)
  location    text,
  opened      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- consumption log: every "-" (entnehmen) writes a row here; quantity is in the same
-- unit as stock_entries.quantity (packs/count).
create table vorrat.consumption_log (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references vorrat.items(id) on delete cascade,
  quantity    numeric not null,
  consumed_at timestamptz not null default now()
);

-- single-row household settings (household size for the reach calculation)
create table vorrat.settings (
  id             smallint primary key default 1,
  household_size int not null default 5,
  updated_at     timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

-- current stock + status per item (security_invoker so RLS applies).
-- current_stock = packs/count; base_stock = current_stock * pack_size (in base_unit).
create view vorrat.item_overview with (security_invoker = true) as
select
  i.id, i.name, i.category_id, i.unit, i.target_stock,
  i.pack_size, i.base_unit, i.daily_use_per_person, i.is_asset,
  coalesce(sum(s.quantity), 0)                                as current_stock,
  coalesce(sum(s.quantity), 0) * i.pack_size                  as base_stock,
  min(s.expiry_date) filter (where s.expiry_date is not null) as next_expiry,
  greatest(i.target_stock - coalesce(sum(s.quantity), 0), 0)  as to_buy
from vorrat.items i
left join vorrat.stock_entries s on s.item_id = i.id
group by i.id;

grant select, insert, update, delete on all tables in schema vorrat to authenticated;
grant all on all tables in schema vorrat to service_role;

-- RLS: shared household. authenticated = full access, anonymous = none.
alter table vorrat.categories      enable row level security;
alter table vorrat.items           enable row level security;
alter table vorrat.stock_entries   enable row level security;
alter table vorrat.consumption_log enable row level security;
alter table vorrat.settings        enable row level security;
create policy "household full access" on vorrat.categories      for all to authenticated using (true) with check (true);
create policy "household full access" on vorrat.items           for all to authenticated using (true) with check (true);
create policy "household full access" on vorrat.stock_entries   for all to authenticated using (true) with check (true);
create policy "household full access" on vorrat.consumption_log for all to authenticated using (true) with check (true);
create policy "household full access" on vorrat.settings        for all to authenticated using (true) with check (true);

-- Seeded categories: Lebensmittel, Wasser, Hygiene, Medizin & Erste Hilfe,
-- Energie (Strom/Holz), Garten & Saatgut, Sonstiges.
-- Seeded energy assets (migration 0002): Brennholz, Photovoltaik-Anlage,
-- Solaranlage, Batteriespeicher.
