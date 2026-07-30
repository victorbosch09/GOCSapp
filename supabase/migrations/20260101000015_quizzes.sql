-- GOCS platform — quizzes de módulos: el mando arma preguntas de opción
-- múltiple ligadas a una habilidad/módulo; el resultado del operador genera
-- automáticamente una evaluación en su hoja de vida.

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid references public.skills (id) on delete set null,
  title text not null,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  question text not null,
  options jsonb not null, -- array de strings
  correct_index int not null,
  sort_order int not null default 0
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  score int not null,
  total int not null,
  completed_at timestamptz not null default now()
);

create index quiz_attempts_profile_id_idx on public.quiz_attempts (profile_id, completed_at desc);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "quizzes_select_approved" on public.quizzes
  for select using (public.is_approved() or public.is_command_staff());
create policy "quizzes_write_staff" on public.quizzes
  for all using (public.is_command_staff() or public.is_instructor())
  with check (public.is_command_staff() or public.is_instructor());

create policy "quiz_questions_select_approved" on public.quiz_questions
  for select using (public.is_approved() or public.is_command_staff());
create policy "quiz_questions_write_staff" on public.quiz_questions
  for all using (public.is_command_staff() or public.is_instructor())
  with check (public.is_command_staff() or public.is_instructor());

create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select using (profile_id = auth.uid());
create policy "quiz_attempts_select_staff" on public.quiz_attempts
  for select using (public.is_command_staff() or public.is_instructor());

-- El insert del intento lo hace el propio soldado (no es un movimiento de
-- saldo, es autoservicio legítimo). La evaluación automática que genera se
-- inserta vía función security definer para poder escribir en
-- skill_evaluations sin necesitar permiso directo de escritura ahí.
create policy "quiz_attempts_insert_own" on public.quiz_attempts
  for insert with check (profile_id = auth.uid());

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
begin
  if v_profile_id is null then
    raise exception 'No autenticado';
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

  select skill_id into v_skill_id from public.quizzes where id = p_quiz_id;

  if v_skill_id is not null then
    v_result := case when (v_score::numeric / v_total::numeric) >= 0.7 then 'aprobado' else 'no_aprobado' end;
    insert into public.skill_evaluations (profile_id, skill_id, result, score, notes, evaluated_by)
    values (
      v_profile_id, v_skill_id, v_result,
      round(100.0 * v_score / v_total),
      format('Quiz autoevaluado: %s/%s correctas', v_score, v_total),
      null
    );
  end if;

  return v_attempt;
end;
$$;

revoke all on function public.submit_quiz_attempt(uuid, int[]) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, int[]) to authenticated;
