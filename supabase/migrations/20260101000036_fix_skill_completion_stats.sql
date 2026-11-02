-- Fix skill_completion_stats view:
-- 1. Only count instructor-assigned evaluations (source = 'instructor'), not quiz self-evaluations.
-- 2. Calculate percentage against the full approved roster, not just evaluated members.

create or replace view public.skill_completion_stats as
select
  s.id as skill_id,
  s.name as skill_name,
  s.category,
  s.sort_order,
  count(se.id) filter (
    where se.result is not null and se.source = 'instructor'
  ) as total_evaluados,
  count(se.id) filter (
    where se.result = 'aprobado' and se.source = 'instructor'
  ) as total_aprobados,
  case
    when (select count(*) from public.profiles where approved = true) = 0 then 0
    else round(
      100.0
      * count(se.id) filter (where se.result = 'aprobado' and se.source = 'instructor')
      / (select count(*) from public.profiles where approved = true)
    )
  end as porcentaje_aprobado
from public.skills s
left join public.skill_evaluations se on se.skill_id = s.id
group by s.id, s.name, s.category, s.sort_order
order by s.sort_order;

grant select on public.skill_completion_stats to authenticated;
