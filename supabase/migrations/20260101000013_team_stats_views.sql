-- GOCS platform — vistas agregadas para el dashboard de equipo ampliado.
-- Igual que team_overview/roster_public: las crea el owner de la migración
-- (bypassrls) y solo exponen agregados, nunca filas individuales de
-- sanciones/recompensas/contratos (que siguen siendo privados por RLS).

create view public.skill_completion_stats as
select
  s.id as skill_id,
  s.name as skill_name,
  s.category,
  s.sort_order,
  count(se.id) filter (where se.result is not null) as total_evaluados,
  count(se.id) filter (where se.result = 'aprobado') as total_aprobados,
  case
    when count(se.id) filter (where se.result is not null) = 0 then 0
    else round(
      100.0 * count(se.id) filter (where se.result = 'aprobado')
      / count(se.id) filter (where se.result is not null)
    )
  end as porcentaje_aprobado
from public.skills s
left join public.skill_evaluations se on se.skill_id = s.id
group by s.id, s.name, s.category, s.sort_order
order by s.sort_order;

create view public.discipline_overview as
select
  (select count(*) from public.sanctions) as total_sanciones,
  (select count(*) from public.rewards) as total_recompensas,
  (select coalesce(sum(amount), 0) from public.rewards where amount is not null) as creditos_en_recompensas;

create view public.operator_rankings as
select
  p.id as profile_id,
  p.callsign,
  p.squad,
  (
    select count(*) from public.contracts c
    where c.profile_id = p.id and c.created_at >= now() - interval '30 days'
  ) as contratos_30d,
  (
    select count(*) from public.event_attendance ea
    join public.events e on e.id = ea.event_id
    where ea.profile_id = p.id and ea.attended = true
      and e.start_at >= now() - interval '30 days'
      and e.event_type in ('entrenamiento', 'operacion')
  ) as asistencias_30d,
  (
    select count(*) from public.events e
    where e.event_type in ('entrenamiento', 'operacion')
      and e.start_at between now() - interval '30 days' and now()
  ) as eventos_oficiales_30d
from public.profiles p
where p.approved = true;

grant select on public.skill_completion_stats to authenticated;
grant select on public.discipline_overview to authenticated;
grant select on public.operator_rankings to authenticated;
