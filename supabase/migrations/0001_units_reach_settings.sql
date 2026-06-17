-- 0001 units / reach / settings
-- Vorrat-LookUp v2: packaging + units model, reach ("reicht noch X Tage") per
-- person & day, and a household-size setting.
--
-- SCOPE: strictly the `vorrat` schema. Never touch `public` (intelligence system).
-- Additive columns + a view replace + a new settings table. Backwards compatible.
-- Applied to the shared Supabase project `ggaiorygjkjhbfkvrfmb` via the Supabase MCP
-- (schema `vorrat` only). Keep docs/SCHEMA.sql and src/lib/supabase/types.ts in sync.

-- 1) items: packaging (content per pack) + per-person daily need + asset flag
alter table vorrat.items add column if not exists pack_size            numeric not null default 1;
alter table vorrat.items add column if not exists base_unit            text;
alter table vorrat.items add column if not exists daily_use_per_person numeric;
alter table vorrat.items add column if not exists is_asset             boolean not null default false;

comment on column vorrat.items.pack_size is 'Inhalt je Packung in base_unit (z.B. 500). 1 = reine Zaehleinheit.';
comment on column vorrat.items.base_unit is 'Basiseinheit des Packungsinhalts (g, ml, l, kg, Ster, kWh). null = reine Zaehleinheit.';
comment on column vorrat.items.daily_use_per_person is 'Verbrauch je Person und Tag in base_unit fuer die Reichweite. null = keine Reichweite.';
comment on column vorrat.items.is_asset is 'true = Anlage/Infrastruktur (PV, Solar, Batteriespeicher): kein MHD, keine Reichweite, kein Nachkauf.';

-- 2) household settings (single row, singleton enforced)
create table if not exists vorrat.settings (
  id             smallint primary key default 1,
  household_size int not null default 5,
  updated_at     timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);
insert into vorrat.settings (id, household_size) values (1, 5) on conflict (id) do nothing;

alter table vorrat.settings enable row level security;
drop policy if exists "household full access" on vorrat.settings;
create policy "household full access" on vorrat.settings for all to authenticated using (true) with check (true);
grant select, insert, update, delete on vorrat.settings to authenticated;
grant all on vorrat.settings to service_role;

-- 3) item_overview: expose packaging + base_stock (in base_unit) for reach calc.
--    current_stock stays in packs/count; base_stock = current_stock * pack_size.
drop view if exists vorrat.item_overview;
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
