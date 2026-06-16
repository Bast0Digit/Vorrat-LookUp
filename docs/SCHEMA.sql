-- Vorrat-LookUp - DB schema REFERENCE.
-- This is ALREADY APPLIED to the shared Supabase project in the `vorrat` schema,
-- and `vorrat` is exposed to the API. Do NOT re-run this; it documents what exists.
-- Generate TypeScript types from the live schema instead. For schema CHANGES, add a
-- new migration under supabase/migrations/.

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
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category_id   uuid references vorrat.categories(id) on delete set null,
  unit          text not null default 'Stück',
  barcode       text,
  target_stock  numeric not null default 0,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table vorrat.stock_entries (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references vorrat.items(id) on delete cascade,
  quantity    numeric not null check (quantity >= 0),
  expiry_date date,
  location    text,
  opened      boolean not null default false,
  created_at  timestamptz not null default now()
);

create table vorrat.consumption_log (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references vorrat.items(id) on delete cascade,
  quantity    numeric not null,
  consumed_at timestamptz not null default now()
);

-- current stock + status per item (security_invoker so RLS applies)
create view vorrat.item_overview with (security_invoker = true) as
select
  i.id, i.name, i.category_id, i.unit, i.target_stock,
  coalesce(sum(s.quantity), 0)                                as current_stock,
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
create policy "household full access" on vorrat.categories      for all to authenticated using (true) with check (true);
create policy "household full access" on vorrat.items           for all to authenticated using (true) with check (true);
create policy "household full access" on vorrat.stock_entries   for all to authenticated using (true) with check (true);
create policy "household full access" on vorrat.consumption_log for all to authenticated using (true) with check (true);

-- Seeded categories: Lebensmittel, Wasser, Hygiene, Medizin & Erste Hilfe,
-- Energie (Strom/Holz), Garten & Saatgut, Sonstiges.
