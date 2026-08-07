-- GOCS platform — leaderboard de quizzes: vista agregada (sin exponer
-- respuestas ni preguntas individuales) para que cualquier aprobado vea el
-- ranking de todo el clan, siguiendo el mismo patrón que operator_rankings.

create view public.quiz_leaderboard as
select
  p.id as profile_id,
  p.callsign,
  p.squad,
  count(qa.id) as intentos,
  count(qa.id) filter (where qa.score::numeric / qa.total::numeric >= 0.7) as aprobados,
  round(avg(qa.score::numeric / qa.total::numeric) * 100) as promedio_pct
from public.profiles p
join public.quiz_attempts qa on qa.profile_id = p.id
where p.approved = true
group by p.id, p.callsign, p.squad;

grant select on public.quiz_leaderboard to authenticated;
