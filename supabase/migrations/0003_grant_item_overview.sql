-- 0003 grant item_overview
-- Fix: migration 0001 dropped + recreated vorrat.item_overview, which lost the grants
-- the original schema gave via `grant ... on all tables`. A recreated view has NO
-- grants, so `authenticated` got "permission denied for view item_overview" and every
-- page using it (Übersicht/Vorrat/Wasser/Energie/Liste) crashed in the Server render.
-- Re-grant explicitly. SCOPE: strictly vorrat. anon intentionally has no access.
grant select on vorrat.item_overview to authenticated;
grant all    on vorrat.item_overview to service_role;
