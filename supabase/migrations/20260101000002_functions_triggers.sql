-- GOCS platform — helper functions, triggers, business-logic RPCs

-- ============================================================
-- HELPERS (security definer so RLS policies can call them without recursion)
-- ============================================================
create or replace function public.is_command_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_command_staff from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_approved()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.approved from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.my_squad()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.squad from public.profiles p where p.id = auth.uid();
$$;

-- ============================================================
-- AUTO-CREAR PERFIL AL REGISTRARSE
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidato_rank_id uuid;
begin
  select id into v_candidato_rank_id from public.ranks where name = 'Candidato' limit 1;

  insert into public.profiles (id, callsign, rank_id, approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'callsign', split_part(new.email, '@', 1)),
    v_candidato_rank_id,
    false
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RECALCULAR SALDO EN CADA MOVIMIENTO
-- ============================================================
create or replace function public.recalc_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  v_profile_id := coalesce(new.profile_id, old.profile_id);

  update public.profiles
  set cached_balance = (
    select coalesce(sum(amount), 0) from public.transactions where profile_id = v_profile_id
  )
  where id = v_profile_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists on_transaction_change on public.transactions;
create trigger on_transaction_change
  after insert or update or delete on public.transactions
  for each row execute function public.recalc_balance();

-- ============================================================
-- COMPRA EN TIENDA (server-side, solo service_role)
-- Valida stock y saldo antes de descontar. Bloquea la fila del perfil
-- para evitar condiciones de carrera en compras simultáneas.
-- ============================================================
create or replace function public.purchase_item(
  p_profile_id uuid,
  p_item_table text, -- 'weapons' | 'equipment' | 'accessories' | 'vehicles'
  p_item_id uuid
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price numeric;
  v_in_stock boolean;
  v_name text;
  v_balance numeric;
  v_txn public.transactions;
  v_txn_type text;
begin
  if p_item_table not in ('weapons', 'equipment', 'accessories', 'vehicles') then
    raise exception 'Categoría de catálogo inválida: %', p_item_table;
  end if;

  execute format(
    'select price, in_stock, name from public.%I where id = $1 for share',
    p_item_table
  ) into v_price, v_in_stock, v_name using p_item_id;

  if v_price is null then
    raise exception 'Ítem no encontrado';
  end if;

  if not v_in_stock then
    raise exception 'Ítem sin stock disponible';
  end if;

  -- Bloquea la fila del perfil para que compras simultáneas no lean el mismo saldo.
  select cached_balance into v_balance from public.profiles where id = p_profile_id for update;

  if v_balance is null then
    raise exception 'Perfil no encontrado';
  end if;

  if v_balance < v_price then
    raise exception 'Saldo insuficiente: saldo % cr, precio % cr', v_balance, v_price;
  end if;

  v_txn_type := case when p_item_table = 'vehicles' then 'Compra Vehiculo' else 'Compra Armamento' end;

  insert into public.transactions (profile_id, type, detail, amount, notes)
  values (p_profile_id, v_txn_type, v_name, -v_price, 'Compra en tienda (' || p_item_table || ')')
  returning * into v_txn;

  return v_txn;
end;
$$;

-- Solo el backend (service role) puede invocar la compra: nunca desde el cliente con anon key.
revoke all on function public.purchase_item(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.purchase_item(uuid, text, uuid) to service_role;

-- ============================================================
-- NÓMINA SEMANAL
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
begin
  for v_profile in
    select p.id as profile_id, r.weekly_wage, r.name as rank_name
    from public.profiles p
    join public.ranks r on r.id = p.rank_id
    where p.approved = true
  loop
    insert into public.transactions (profile_id, type, detail, amount, notes)
    values (
      v_profile.profile_id,
      'Sueldo',
      'Sueldo semanal - ' || v_profile.rank_name,
      v_profile.weekly_wage,
      'Pago semanal automático'
    );

    v_count := v_count + 1;
    v_total := v_total + v_profile.weekly_wage;
  end loop;

  insert into public.payroll_runs (triggered_by, profiles_paid, total_amount, status)
  values (p_triggered_by, v_count, v_total, 'success')
  returning * into v_run;

  return v_run;
end;
$$;

revoke all on function public.run_weekly_payroll(uuid) from public, anon, authenticated;
grant execute on function public.run_weekly_payroll(uuid) to service_role;

-- ============================================================
-- CARGA DE CONTRATO (bono grupal) — server-side, solo service_role
-- ============================================================
create or replace function public.log_contract(
  p_profile_ids uuid[],
  p_risk_level int,
  p_bonuses jsonb,
  p_total_amount numeric,
  p_logged_by uuid,
  p_notes text default null
)
returns setof public.contracts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_contract public.contracts;
begin
  foreach v_profile_id in array p_profile_ids loop
    insert into public.contracts (profile_id, risk_level, bonuses, total_amount, logged_by, notes)
    values (v_profile_id, p_risk_level, p_bonuses, p_total_amount, p_logged_by, p_notes)
    returning * into v_contract;

    insert into public.transactions (profile_id, type, detail, amount, notes, created_by)
    values (
      v_profile_id,
      'Bono',
      'Bono de contrato',
      p_total_amount,
      p_notes,
      p_logged_by
    );

    return next v_contract;
  end loop;
end;
$$;

revoke all on function public.log_contract(uuid[], int, jsonb, numeric, uuid, text) from public, anon, authenticated;
grant execute on function public.log_contract(uuid[], int, jsonb, numeric, uuid, text) to service_role;
