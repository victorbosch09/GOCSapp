-- GOCS platform — el bono de créditos por aprobar un quiz ahora es
-- configurable por quiz (antes era un valor fijo de 1000cr para todos).

alter table public.quizzes add column bonus_amount numeric not null default 1000 check (bonus_amount >= 0);

comment on column public.quizzes.bonus_amount is 'Créditos que se acreditan la primera vez que un operador aprueba (>=70%) este quiz.';

create or replace function public.submit_quiz_attempt(
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
  v_bonus_awarded boolean := false;
  v_bonus_amount numeric;
begin
  if v_profile_id is null then
    raise exception 'No autenticado';
  end if;

  if exists (
    select 1 from public.quiz_attempts where quiz_id = p_quiz_id and profile_id = v_profile_id
  ) then
    raise exception 'Ya rendiste este quiz — no se puede repetir.';
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

  insert into public.quiz_attempts (quiz_id, profile_id, score, total)
  values (p_quiz_id, v_profile_id, v_score, v_total)
  returning * into v_attempt;

  select skill_id, title, bonus_amount into v_skill_id, v_quiz_title, v_bonus_amount
  from public.quizzes where id = p_quiz_id;

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

  if v_passed and v_bonus_amount > 0 then
    insert into public.transactions (profile_id, type, detail, amount, notes)
    values (
      v_profile_id,
      'Bono',
      format('Quiz aprobado: %s', coalesce(v_quiz_title, 'Quiz')),
      v_bonus_amount,
      format('%s/%s correctas', v_score, v_total)
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
