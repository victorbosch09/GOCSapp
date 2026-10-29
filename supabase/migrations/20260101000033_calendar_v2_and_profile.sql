-- GOCS platform — Calendar V2 + Operator Profile enhancements
-- 1. Extend events with instructor, signup cap, and Discord poll tracking
-- 2. Add source field to skill_evaluations to distinguish instructor vs quiz vs bot
-- 3. Update skills with proper names from the GOCS operator manual
-- 4. Add specialty courses as individual skills
-- 5. Add structured requirements JSON to ranks for programmatic progression display

-- ============================================================
-- EVENTS: instructor assignment, signup, discord poll tracking
-- ============================================================
alter table public.events
  add column if not exists instructor_id uuid references public.profiles (id) on delete set null,
  add column if not exists max_participants int,
  add column if not exists requires_signup boolean not null default false,
  add column if not exists discord_poll_message_id text;

comment on column public.events.instructor_id is 'Instructor asignado para eventos de entrenamiento.';
comment on column public.events.max_participants is 'Cupo máximo de participantes (null = sin límite).';
comment on column public.events.requires_signup is 'Si true, los soldados deben inscribirse previamente desde la app.';
comment on column public.events.discord_poll_message_id is 'ID del mensaje del poll de asistencia en Discord (para futura integración con bot).';

-- ============================================================
-- SKILL EVALUATIONS: add source field
-- ============================================================
alter table public.skill_evaluations
  add column if not exists source text not null default 'instructor'
    check (source in ('instructor', 'quiz', 'bot'));

comment on column public.skill_evaluations.source is 'Origen de la evaluación: instructor (mando/instructor la cargó), quiz (autoevaluación), bot (bot de Discord la registró).';

-- Retroactively mark quiz-auto-generated evaluations
update public.skill_evaluations
  set source = 'quiz'
  where evaluated_by is null
    and notes like 'Quiz autoevaluado:%';

-- Update submit_quiz_attempt to tag new evaluations as source='quiz'
create or replace function public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_answers int[]
)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid := auth.uid();
  v_question record;
  v_idx int := 1;
  v_score int := 0;
  v_total int := 0;
  v_attempt public.quiz_attempts;
  v_skill_id uuid;
  v_result text;
  v_retry_allowed boolean;
  v_existing_pass int;
begin
  if v_profile_id is null then
    raise exception 'No autenticado';
  end if;

  select q.skill_id, coalesce(qc.retry_allowed, true)
  into v_skill_id, v_retry_allowed
  from public.quizzes q
  left join public.quiz_config qc on qc.quiz_id = q.id
  where q.id = p_quiz_id;

  if not v_retry_allowed then
    select count(*) into v_existing_pass
    from public.quiz_attempts
    where quiz_id = p_quiz_id and profile_id = v_profile_id and (score::numeric / total::numeric) >= 0.7;
    if v_existing_pass > 0 then
      raise exception 'Ya aprobaste este quiz y no se permiten reintentos.';
    end if;
  end if;

  for v_question in
    select * from public.quiz_questions where quiz_id = p_quiz_id order by sort_order
  loop
    v_total := v_total + 1;
    if p_answers[v_idx] = v_question.correct_index then
      v_score := v_score + 1;
    end if;
    v_idx := v_idx + 1;
  end loop;

  if v_total = 0 then
    raise exception 'El quiz no tiene preguntas cargadas';
  end if;

  insert into public.quiz_attempts (quiz_id, profile_id, score, total)
  values (p_quiz_id, v_profile_id, v_score, v_total)
  returning * into v_attempt;

  if v_skill_id is not null then
    v_result := case when (v_score::numeric / v_total::numeric) >= 0.7 then 'aprobado' else 'no_aprobado' end;
    insert into public.skill_evaluations (profile_id, skill_id, result, score, notes, evaluated_by, source)
    values (
      v_profile_id, v_skill_id, v_result,
      round(100.0 * v_score / v_total),
      format('Quiz autoevaluado: %s/%s correctas', v_score, v_total),
      null,
      'quiz'
    );
  end if;

  return v_attempt;
end;
$$;

-- ============================================================
-- SKILLS: update with proper names from GOCS operator manual
-- ============================================================
update public.skills set
  name = 'Mod 1 — Controles Básicos y Organización',
  description = 'Controles del juego, interfaz, comunicación básica por radio y estructura organizacional del GOCS. Base obligatoria para todo aspirante.'
  where name = 'Mod 1';

update public.skills set
  name = 'Mod 2 — Saltos, Repliegues y CQB Básico',
  description = 'Técnicas de salto desde vehículos y aeronaves, repliegues coordinados y fundamentos del combate en zonas urbanizadas (CQB).'
  where name = 'Mod 2';

update public.skills set
  name = 'Mod 3 — CQB Avanzado',
  description = 'Entradas dinámicas, fatal funnel, movimiento en pasillos y coordinación de equipo en espacios cerrados de alta amenaza.'
  where name = 'Mod 3';

update public.skills set
  name = 'Mod 4 — Aerotransportada',
  description = 'Operaciones de inserción y extracción aérea: fast rope, rappel desde helicóptero, LZ caliente y coordinación con pilotos.'
  where name = 'Mod 4';

update public.skills set
  name = 'Mod 5 — Movimientos de Equipo y Coordinación',
  description = 'Formaciones tácticas de escuadra, supresión y maniobra, comunicaciones de equipo y gestión del campo de batalla.'
  where name = 'Mod 5';

update public.skills set
  name = 'Mod 6 — Reconocimiento y Vigilancia',
  description = 'Técnicas de observación, reporte SALUTE, patrullaje de reconocimiento y empleo de drones tácticos.'
  where name = 'Mod 6';

update public.skills set
  name = 'Mod 7 — Navegación Táctica',
  description = 'Lectura de mapa, navegación por puntos de control, uso del GPS táctico y orientación en terreno desconocido.'
  where name = 'Mod 7';

update public.skills set
  name = 'Mod 8 — Asalto y Defensa',
  description = 'Fuego y maniobra ofensiva, establecimiento de posiciones defensivas, consolidación de objetivo y preparación del siguiente movimiento.'
  where name = 'Mod 8';

update public.skills set
  name = 'Mod 9 — Interacción Civil y ROE',
  description = 'Checkpoints, escalada de fuerza, PID (Positive Identification), trato con población civil y aplicación de reglas de enfrentamiento.'
  where name = 'Mod 9';

update public.skills set
  name = 'Mod 10 — Logística y Apoyo',
  description = 'Gestión de munición y suministros en campo, evacuación de bajas, resupply bajo fuego y mantenimiento del impulso operacional.'
  where name = 'Mod 10';

update public.skills set
  name = 'Mod 11 — Comunicaciones Avanzadas',
  description = 'Protocolo de radio avanzado, SALUTE, brevity codes, reportes de nueve líneas (MEDEVAC, CAS) y gestión del espectro electromagnético.'
  where name = 'Mod 11';

update public.skills set
  name = 'Curso Rol Especializado',
  description = 'Certificación genérica de rol especializado. Reemplazada por los cursos específicos (Ametrallador, Granadero, etc.) — se mantiene por compatibilidad.'
  where name = 'Curso Rol Especializado';

-- ============================================================
-- NEW SPECIALTY COURSES (visible in app, not yet Discord roles)
-- ============================================================
insert into public.skills (name, category, description, sort_order) values
  ('Primeros Auxilios', 'Curso especializado', 'Atención pre-hospitalaria en combate: torniquetes, vendajes de presión, MARCH y evacuación de bajas bajo fuego.', 20),
  ('Ametrallador', 'Curso especializado', 'Manejo, posicionamiento y doctrina del arma de apoyo de fuego pesado en escuadra. Sectores de tiro, puntos de anclaje y coordinación.', 21),
  ('Granadero', 'Curso especializado', 'Empleo del lanzagranadas bajo cañón y granadas de mano: ángulos de tiro, efectos de fuego indirecto y seguridad en combate cercano.', 22),
  ('Rappel', 'Curso especializado', 'Descenso en rappel desde estructuras y helicópteros: nudo de seguridad, control de descenso y transición al combate al pie.', 23),
  ('Experto en Shooting Drill', 'Curso especializado', 'Certificación de puntería y manejo de arma: recargas tácticas, cambio de posición bajo fuego y dominio del gatillo en stress.', 24),
  ('Francotirador', 'Curso especializado', 'Empleo del rifle de precisión: rangefinding, compensación de viento y elevación, hide site y extracción encubierta.', 25),
  ('Operador de Drones', 'Curso especializado', 'Reconocimiento y señalamiento de objetivos con drones tácticos. Integración con el equipo de tierra y protocolo de zona aérea.', 26),
  ('Conductor Táctico', 'Curso especializado', 'Conducción de vehículos en zona de combate: convoy, bounding overwatch, recuperación de vehículo inutilizado y reacción a emboscada.', 27)
on conflict (name) do nothing;

-- ============================================================
-- RANKS: add structured requirements JSON for progression UI
-- ============================================================
alter table public.ranks
  add column if not exists requirements_json jsonb;

comment on column public.ranks.requirements_json is 'Requisitos estructurados para ascender A este rango: módulos, contratos, cursos. Alimenta la UI de progresión de carrera.';

update public.ranks set requirements_json = '{"modules":[1,2,3,4],"contracts":4,"note":"Finalizar proceso de admisión"}' where abbreviation = 'ON-1';
update public.ranks set requirements_json = '{"contracts":8,"previous_rank_abbr":"ON-1"}' where abbreviation = 'ON-2';
update public.ranks set requirements_json = '{"contracts":16,"previous_rank_abbr":"ON-2"}' where abbreviation = 'ON-S';
update public.ranks set requirements_json = '{"modules":[5,6,7,8],"specialty_courses":1,"contracts":5,"previous_rank_abbr":"ON-S"}' where abbreviation = 'EN-1';
update public.ranks set requirements_json = '{"specialty_courses":3,"contracts":5,"previous_rank_abbr":"EN-1"}' where abbreviation = 'EN-2';
update public.ranks set requirements_json = '{"modules":[9,10,11],"specialty_courses":5,"contracts":10,"previous_rank_abbr":"EN-2"}' where abbreviation = 'EN-S';
update public.ranks set requirements_json = '{"leadership_course":"Curso Lider de Equipo","contracts":8,"previous_rank_abbr":"EN-S"}' where abbreviation = 'LE';
update public.ranks set requirements_json = '{"leadership_course":"Curso Lider de Escuadra","contracts":10,"requires_vote":true,"previous_rank_abbr":"LE"}' where abbreviation = 'LP';
