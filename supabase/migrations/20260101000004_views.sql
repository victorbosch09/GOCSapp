-- GOCS platform — vistas agregadas / compartidas
-- Estas vistas las crea el owner de la migración (rol con bypassrls), por lo
-- que exponen agregados o columnas no sensibles sin depender de las políticas
-- RLS de `profiles`. Nunca seleccionan cached_balance por fila individual.

create view public.team_overview as
select
  (select count(*) from public.profiles where approved = true) as total_soldados_activos,
  (
    select coalesce(sum(r.weekly_wage), 0)
    from public.profiles p
    join public.ranks r on r.id = p.rank_id
    where p.approved = true
  ) as nomina_semanal_total,
  (
    select coalesce(sum(-amount), 0)
    from public.transactions
    where type = 'Compra Armamento'
  ) as gasto_total_armamento,
  (
    select coalesce(sum(-amount), 0)
    from public.transactions
    where type = 'Compra Vehiculo'
  ) as gasto_total_vehiculos,
  (
    select count(*) from public.events where start_at >= now()
  ) as proximos_eventos_count;

create view public.roster_public as
select
  p.id,
  p.callsign,
  p.squad,
  p.join_date,
  p.avatar_url,
  p.is_command_staff,
  r.name as rank_name,
  r.abbreviation as rank_abbreviation,
  r.sort_order as rank_sort_order
from public.profiles p
left join public.ranks r on r.id = p.rank_id
where p.approved = true;

grant select on public.team_overview to authenticated;
grant select on public.roster_public to authenticated;
