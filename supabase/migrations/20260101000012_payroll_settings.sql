-- GOCS platform — configuración de nómina: umbral de asistencia y si el
-- cron automático semanal está habilitado. El botón manual del admin
-- siempre funciona, sin importar auto_run_enabled.

create table public.payroll_settings (
  id boolean primary key default true,
  attendance_threshold numeric not null default 0.5,
  attendance_gating_enabled boolean not null default true,
  auto_run_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint payroll_settings_singleton check (id)
);

comment on table public.payroll_settings is 'Fila única de configuración de nómina semanal.';

insert into public.payroll_settings (id) values (true);

alter table public.payroll_settings enable row level security;

create policy "payroll_settings_select_command_staff" on public.payroll_settings
  for select using (public.is_command_staff());
create policy "payroll_settings_update_command_staff" on public.payroll_settings
  for update using (public.is_command_staff()) with check (public.is_command_staff());

-- ============================================================
-- run_weekly_payroll(): ahora lee el umbral de asistencia y si el
-- cron automático está habilitado desde payroll_settings.
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
begin
  select * into v_settings from public.payroll_settings where id = true;

  -- Si el cron automático está deshabilitado, no hacer nada (salvo que sea
  -- una ejecución manual, es decir p_triggered_by no es null).
  if p_triggered_by is null and not v_settings.auto_run_enabled then
    insert into public.payroll_runs (triggered_by, profiles_paid, total_amount, status, notes)
    values (null, 0, 0, 'success', 'Cron automático deshabilitado en configuración — no se ejecutó.')
    returning * into v_run;
    return v_run;
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

  insert into public.payroll_runs (triggered_by, profiles_paid, total_amount, status)
  values (p_triggered_by, v_count, v_total, 'success')
  returning * into v_run;

  return v_run;
end;
$$;

revoke all on function public.run_weekly_payroll(uuid) from public, anon, authenticated;
grant execute on function public.run_weekly_payroll(uuid) to service_role;
