-- GOCS platform — tesorería del grupo, bloqueo de repetición de quizzes,
-- y asistencia cargada exclusivamente por el mando.

-- ============================================================
-- TESORERÍA — presupuesto general del GOCS (separado del saldo individual
-- de cada soldado). Recibe el pago semanal de contratistas (OLAD) y de ahí
-- sale la nómina y los gastos generales/armamento.
-- ============================================================
create table public.treasury (
  id boolean primary key default true,
  balance numeric not null default 0,
  weekly_income numeric not null default 50000,
  updated_at timestamptz not null default now(),
  constraint treasury_singleton check (id)
);

comment on table public.treasury is 'Fila única: presupuesto general del GOCS, separado de los saldos individuales.';

insert into public.treasury (id) values (true);

create table public.treasury_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('ingreso', 'nomina', 'armamento', 'gastos_generales', 'ajuste')),
  amount numeric not null, -- positivo = ingreso, negativo = egreso
  detail text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index treasury_transactions_created_at_idx on public.treasury_transactions (created_at desc);

create or replace function public.apply_treasury_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.treasury set balance = balance + new.amount, updated_at = now() where id = true;
  return new;
end;
$$;

create trigger treasury_transactions_apply
  after insert on public.treasury_transactions
  for each row execute function public.apply_treasury_transaction();

alter table public.treasury enable row level security;
alter table public.treasury_transactions enable row level security;

create policy "treasury_select_command_staff" on public.treasury
  for select using (public.is_command_staff());
create policy "treasury_update_command_staff" on public.treasury
  for update using (public.is_command_staff()) with check (public.is_command_staff());

create policy "treasury_transactions_select_command_staff" on public.treasury_transactions
  for select using (public.is_command_staff());
create policy "treasury_transactions_insert_command_staff" on public.treasury_transactions
  for insert with check (public.is_command_staff());

-- ============================================================
-- run_weekly_payroll(): ahora también cobra el ingreso semanal de
-- contratistas a la tesorería y le descuenta el gasto de nómina.
-- ============================================================
create or replace function public.run_weekly_payroll(p_triggered_by uuid default null)
returns public.payroll_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile record;
  v_count int := 0;
  v_total numeric := 0;
  v_run public.payroll_runs;
  v_total_events int;
  v_attended_events int;
  v_window_start timestamptz := now() - interval '7 days';
  v_settings public.payroll_settings;
  v_weekly_income numeric;
begin
  select * into v_settings from public.payroll_settings where id = true;

  if p_triggered_by is null and not v_settings.auto_run_enabled then
    insert into public.payroll_runs (triggered_by, profiles_paid, total_amount, status, notes)
    values (null, 0, 0, 'success', 'Cron automático deshabilitado en configuración — no se ejecutó.')
    returning * into v_run;
    return v_run;
  end if;

  -- Ingreso semanal de contratistas (OLAD) a la tesorería del grupo.
  select weekly_income into v_weekly_income from public.treasury where id = true;
  if v_weekly_income > 0 then
    insert into public.treasury_transactions (type, amount, detail)
    values ('ingreso', v_weekly_income, 'Pago semanal de contratistas (OLAD)');
  end if;

  for v_profile in
    select p.id as profile_id, r.weekly_wage, r.name as rank_name
    from public.profiles p
    join public.ranks r on r.id = p.rank_id
    where p.approved = true
  loop
    if not v_settings.attendance_gating_enabled then
      insert into public.transactions (profile_id, type, detail, amount, notes)
      values (
        v_profile.profile_id, 'Sueldo', 'Sueldo semanal - ' || v_profile.rank_name,
        v_profile.weekly_wage, 'Pago semanal automático (asistencia no condiciona el pago)'
      );
      v_count := v_count + 1;
      v_total := v_total + v_profile.weekly_wage;
      continue;
    end if;

    select count(*) into v_total_events
    from public.events e
    where e.event_type in ('entrenamiento', 'operacion')
      and e.start_at between v_window_start and now();

    if v_total_events = 0 then
      insert into public.transactions (profile_id, type, detail, amount, notes)
      values (
        v_profile.profile_id, 'Sueldo', 'Sueldo semanal - ' || v_profile.rank_name,
        v_profile.weekly_wage, 'Pago semanal automático (sin actividades oficiales esta semana)'
      );
      v_count := v_count + 1;
      v_total := v_total + v_profile.weekly_wage;
    else
      select count(*) into v_attended_events
      from public.event_attendance ea
      join public.events e on e.id = ea.event_id
      where ea.profile_id = v_profile.profile_id
        and ea.attended = true
        and e.event_type in ('entrenamiento', 'operacion')
        and e.start_at between v_window_start and now();

      if (v_attended_events::numeric / v_total_events::numeric) >= v_settings.attendance_threshold then
        insert into public.transactions (profile_id, type, detail, amount, notes)
        values (
          v_profile.profile_id, 'Sueldo', 'Sueldo semanal - ' || v_profile.rank_name,
          v_profile.weekly_wage,
          format('Pago semanal automático (asistencia %s/%s)', v_attended_events, v_total_events)
        );
        v_count := v_count + 1;
        v_total := v_total + v_profile.weekly_wage;
      end if;
    end if;
  end loop;

  if v_total > 0 then
    insert into public.treasury_transactions (type, amount, detail)
    values ('nomina', -v_total, format('Nómina semanal — %s soldados pagados', v_count));
  end if;

  insert into public.payroll_runs (triggered_by, profiles_paid, total_amount, status)
  values (p_triggered_by, v_count, v_total, 'success')
  returning * into v_run;

  return v_run;
end;
$$;

revoke all on function public.run_weekly_payroll(uuid) from public, anon, authenticated;
grant execute on function public.run_weekly_payroll(uuid) to service_role;

-- ============================================================
-- QUIZZES — bloqueo total de repetición (no solo el bono: ni se puede
-- volver a rendir un quiz ya hecho).
-- ============================================================
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
  v_bonus_awarded boolean := false;
  v_bonus_amount constant numeric := 1000;
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

  if v_passed then
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

-- ============================================================
-- ASISTENCIA — se elimina el auto-servicio: la respuesta de Discord ahora
-- la carga el mando manualmente (no todos entran a la web a marcarla).
-- ============================================================
drop policy if exists "event_rsvps_upsert_own" on public.event_rsvps;
drop policy if exists "event_rsvps_update_own" on public.event_rsvps;
