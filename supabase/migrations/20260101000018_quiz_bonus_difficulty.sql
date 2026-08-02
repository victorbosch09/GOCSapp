-- GOCS platform — quizzes: dificultad, y bono automático de 1000cr la
-- primera vez que un operador aprueba (>=70%) un quiz dado. También se
-- desacopla el conteo de "aprobado" de si el quiz tiene o no una
-- habilidad/módulo vinculado, para que el intento siempre cuente en las
-- estadísticas del operador aunque el quiz no esté ligado a un módulo.

alter table public.quizzes add column difficulty text not null default 'media'
  check (difficulty in ('facil', 'media', 'dificil'));

-- Antes devolvía directamente la fila de quiz_attempts; ahora devuelve un
-- jsonb con esos mismos campos + bonus_awarded, para que el cliente pueda
-- mostrar el bono sin adivinar. Postgres no permite cambiar el tipo de
-- retorno con CREATE OR REPLACE, así que hay que dropear primero.
drop function if exists public.submit_quiz_attempt(uuid, int[]);

create function public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_answers int[]
)
returns jsonb
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
  v_quiz_title text;
  v_result text;
  v_passed boolean;
  v_had_prior_pass boolean;
  v_bonus_awarded boolean := false;
  v_bonus_amount constant numeric := 1000;
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

  v_passed := (v_score::numeric / v_total::numeric) >= 0.7;

  -- ¿Ya había aprobado este quiz antes? (para no otorgar el bono dos veces)
  select exists (
    select 1 from public.quiz_attempts qa
    where qa.quiz_id = p_quiz_id
      and qa.profile_id = v_profile_id
      and (qa.score::numeric / qa.total::numeric) >= 0.7
  ) into v_had_prior_pass;

  insert into public.quiz_attempts (quiz_id, profile_id, score, total)
  values (p_quiz_id, v_profile_id, v_score, v_total)
  returning * into v_attempt;

  select skill_id, title into v_skill_id, v_quiz_title from public.quizzes where id = p_quiz_id;

  if v_skill_id is not null then
    v_result := case when v_passed then 'aprobado' else 'no_aprobado' end;
    insert into public.skill_evaluations (profile_id, skill_id, result, score, notes, evaluated_by)
    values (
      v_profile_id, v_skill_id, v_result,
      round(100.0 * v_score / v_total),
      format('Quiz autoevaluado: %s/%s correctas', v_score, v_total),
      null
    );
  end if;

  if v_passed and not v_had_prior_pass then
    insert into public.transactions (profile_id, type, detail, amount, notes)
    values (
      v_profile_id,
      'Bono',
      format('Quiz aprobado: %s', coalesce(v_quiz_title, 'Quiz')),
      v_bonus_amount,
      format('%s/%s correctas — primera aprobación de este quiz', v_score, v_total)
    );
    v_bonus_awarded := true;
  end if;

  return jsonb_build_object(
    'id', v_attempt.id,
    'quiz_id', v_attempt.quiz_id,
    'profile_id', v_attempt.profile_id,
    'score', v_attempt.score,
    'total', v_attempt.total,
    'completed_at', v_attempt.completed_at,
    'passed', v_passed,
    'bonus_awarded', v_bonus_awarded,
    'bonus_amount', case when v_bonus_awarded then v_bonus_amount else 0 end
  );
end;
$$;

revoke all on function public.submit_quiz_attempt(uuid, int[]) from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, int[]) to authenticated;
