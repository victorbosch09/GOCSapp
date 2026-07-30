-- GOCS platform — la nómina semanal ahora respeta la regla del clan:
-- asistencia menor al 50% de las actividades oficiales de la semana
-- (entrenamiento/operación) => no se acredita el sueldo de ese período.
-- Si no hubo actividades oficiales esa semana, se paga normalmente.

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
begin
  for v_profile in
    select p.id as profile_id, r.weekly_wage, r.name as rank_name
    from public.profiles p
    join public.ranks r on r.id = p.rank_id
    where p.approved = true
  loop
    select count(*) into v_total_events
    from public.events e
    where e.event_type in ('entrenamiento', 'operacion')
      and e.start_at between v_window_start and now();

    if v_total_events = 0 then
      -- Sin actividades oficiales esta semana: se paga igual.
      insert into public.transactions (profile_id, type, detail, amount, notes)
      values (
        v_profile.profile_id,
        'Sueldo',
        'Sueldo semanal - ' || v_profile.rank_name,
        v_profile.weekly_wage,
        'Pago semanal automático (sin actividades oficiales esta semana)'
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

      if (v_attended_events::numeric / v_total_events::numeric) >= 0.5 then
        insert into public.transactions (profile_id, type, detail, amount, notes)
        values (
          v_profile.profile_id,
          'Sueldo',
          'Sueldo semanal - ' || v_profile.rank_name,
          v_profile.weekly_wage,
          format('Pago semanal automático (asistencia %s/%s)', v_attended_events, v_total_events)
        );
        v_count := v_count + 1;
        v_total := v_total + v_profile.weekly_wage;
      end if;
      -- Asistencia < 50%: no se acredita sueldo. No se inserta transacción,
      -- pero queda registrado a través de la tabla event_attendance.
    end if;
  end loop;

  insert into public.payroll_runs (triggered_by, profiles_paid, total_amount, status)
  values (p_triggered_by, v_count, v_total, 'success')
  returning * into v_run;

  return v_run;
end;
$$;

revoke all on function public.run_weekly_payroll(uuid) from public, anon, authenticated;
grant execute on function public.run_weekly_payroll(uuid) to service_role;
