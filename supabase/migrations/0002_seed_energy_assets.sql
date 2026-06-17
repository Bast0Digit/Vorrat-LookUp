-- 0002 seed energy assets
-- Record the household's existing energy reserves/assets directly, as requested:
-- a small battery storage, some firewood, a PV system and a solar system.
-- Idempotent: skips a row if an item with the same name already exists.
-- SCOPE: strictly the `vorrat` schema.

insert into vorrat.items
  (name, category_id, unit, pack_size, base_unit, daily_use_per_person, is_asset, target_stock, notes)
select
  v.name,
  (select id from vorrat.categories where name = 'Energie (Strom/Holz)'),
  v.unit, v.pack_size, v.base_unit, v.daily_use_per_person, v.is_asset, v.target_stock, v.notes
from (values
  ('Brennholz',           'Ster',   1::numeric, 'Ster',        null::numeric, false, 0::numeric, 'Brennholz-Vorrat. Menge in Ster pflegen; Heiztage spaeter ueber Verbrauch/Tag moeglich.'),
  ('Photovoltaik-Anlage', 'Anlage', 1::numeric, null::text,    null::numeric, true,  0::numeric, 'PV-Anlage (Strom). Leistung in kWp und Eigenverbrauch als Notiz.'),
  ('Solaranlage',         'Anlage', 1::numeric, null::text,    null::numeric, true,  0::numeric, 'Solaranlage (Solarthermie/Warmwasser). Eckdaten als Notiz.'),
  ('Batteriespeicher',    'Anlage', 1::numeric, null::text,    null::numeric, true,  0::numeric, 'Kleiner Energiespeicher. Kapazitaet in kWh als Notiz.')
) as v(name, unit, pack_size, base_unit, daily_use_per_person, is_asset, target_stock, notes)
where not exists (
  select 1 from vorrat.items i where lower(i.name) = lower(v.name)
);
