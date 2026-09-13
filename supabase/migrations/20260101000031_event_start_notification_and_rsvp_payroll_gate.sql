-- Two independent changes:
--
-- 1) Track whether the "el evento arrancó" Discord notification was already
--    sent for an event, so the opportunistic (page-load-triggered) check
--    never double-posts. There's no per-minute cron on the Hobby plan to
--    fire this exactly at start time, so it's checked cheaply whenever
--    someone loads a page in the app instead — see checkAndNotifyStartedEvents
--    in lib/actions/events-notify.ts.
alter table public.events add column start_notified_at timestamptz;

comment on column public.events.start_notified_at is
  'Set once the "evento arrancó" Discord webhook post fires, so the opportunistic page-load check never posts twice for the same event.';

-- 2) Nómina: condicionar el pago semanal a quién MARCÓ asistencia en
-- Discord (event_rsvps.response = 'asiste'), no a quién asistió realmente
-- (event_attendance). El mando considera la marca obligatoria en días
-- oficiales y más importante que la asistencia real registrada después.
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
      -- Cuenta MARCADO en Discord (event_rsvps.response = 'asiste'), no
      -- asistencia real (event_attendance) — es lo obligatorio y lo que
      -- ahora condiciona el sueldo.
      select count(*) into v_attended_events
      from public.event_rsvps er
      join public.events e on e.id = er.event_id
      where er.profile_id = v_profile.profile_id
        and er.response = 'asiste'
        and e.event_type in ('entrenamiento', 'operacion')
        and e.start_at between v_window_start and now();

      if (v_attended_events::numeric / v_total_events::numeric) >= v_settings.attendance_threshold then
        insert into public.transactions (profile_id, type, detail, amount, notes)
        values (
          v_profile.profile_id, 'Sueldo', 'Sueldo semanal - ' || v_profile.rank_name,
          v_profile.weekly_wage,
          format('Pago semanal automático (marcó asistencia en Discord %s/%s)', v_attended_events, v_total_events)
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
