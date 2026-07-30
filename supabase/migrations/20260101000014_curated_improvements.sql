-- GOCS platform — mejoras curadas: compra con rango mínimo, anuncios
-- fijados, perfil propio (bio), rol de instructor, y auditoría liviana.

-- ============================================================
-- COMPRA CON RANGO MÍNIMO
-- ============================================================
alter table public.weapons add column min_rank_sort_order int;
alter table public.equipment add column min_rank_sort_order int;
alter table public.accessories add column min_rank_sort_order int;
alter table public.vehicles add column min_rank_sort_order int;

create or replace function public.purchase_item(
  p_profile_id uuid,
  p_item_table text,
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
  v_category text;
  v_min_rank int;
  v_profile_rank_sort int;
  v_balance numeric;
  v_txn public.transactions;
  v_txn_type text;
begin
  if p_item_table not in ('weapons', 'equipment', 'accessories', 'vehicles') then
    raise exception 'Categoría de catálogo inválida: %', p_item_table;
  end if;

  execute format(
    'select price, in_stock, name, category, min_rank_sort_order from public.%I where id = $1 for share',
    p_item_table
  ) into v_price, v_in_stock, v_name, v_category, v_min_rank using p_item_id;

  if v_price is null then
    raise exception 'Ítem no encontrado';
  end if;

  if not v_in_stock then
    raise exception 'Ítem sin stock disponible';
  end if;

  select r.sort_order into v_profile_rank_sort
  from public.profiles p
  join public.ranks r on r.id = p.rank_id
  where p.id = p_profile_id;

  if v_min_rank is not null and (v_profile_rank_sort is null or v_profile_rank_sort < v_min_rank) then
    raise exception 'Tu rango no alcanza el mínimo requerido para este ítem';
  end if;

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

  insert into public.inventory (profile_id, item_table, item_id, item_name, item_category, purchase_price, purchase_transaction_id)
  values (p_profile_id, p_item_table, p_item_id, v_name, v_category, v_price, v_txn.id);

  return v_txn;
end;
$$;

revoke all on function public.purchase_item(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.purchase_item(uuid, text, uuid) to service_role;

-- ============================================================
-- ANUNCIOS FIJADOS
-- ============================================================
alter table public.notifications add column pinned boolean not null default false;

-- ============================================================
-- PERFIL PROPIO (bio) + flag de onboarding
-- ============================================================
alter table public.profiles add column bio text;
alter table public.profiles add column onboarded boolean not null default false;

-- ============================================================
-- ROL DE INSTRUCTOR (más liviano que mando completo, solo entrenamiento)
-- ============================================================
alter table public.profiles add column is_instructor boolean not null default false;

create or replace function public.is_instructor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_instructor from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

drop policy if exists "skill_evaluations_select_command_staff" on public.skill_evaluations;
create policy "skill_evaluations_select_command_staff" on public.skill_evaluations
  for select using (public.is_command_staff() or public.is_instructor());
drop policy if exists "skill_evaluations_write_command_staff" on public.skill_evaluations;
create policy "skill_evaluations_write_command_staff" on public.skill_evaluations
  for all using (public.is_command_staff() or public.is_instructor())
  with check (public.is_command_staff() or public.is_instructor());

drop policy if exists "skills_write_command_staff" on public.skills;
create policy "skills_write_command_staff" on public.skills
  for all using (public.is_command_staff() or public.is_instructor())
  with check (public.is_command_staff() or public.is_instructor());

drop policy if exists "training_materials_write_command_staff" on public.training_materials;
create policy "training_materials_write_command_staff" on public.training_materials
  for all using (public.is_command_staff() or public.is_instructor())
  with check (public.is_command_staff() or public.is_instructor());

-- Instructores pueden leer perfiles (para elegir soldado al evaluar), pero
-- no escribir sobre ellos — eso sigue siendo exclusivo de mando.
create policy "profiles_select_instructor" on public.profiles
  for select using (public.is_instructor());

-- ============================================================
-- AUDITORÍA LIVIANA — acciones sensibles del mando
-- ============================================================
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_profile_id uuid references public.profiles (id) on delete set null,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

create policy "admin_audit_log_select_command_staff" on public.admin_audit_log
  for select using (public.is_command_staff());

-- Sin policies de insert para el cliente: se escribe solo desde Server
-- Actions con la service role key, junto a la acción sensible que audita.
