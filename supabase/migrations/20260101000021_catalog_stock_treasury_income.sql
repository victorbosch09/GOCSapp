-- GOCS platform — control de stock numérico en el catálogo (reemplaza el
-- booleano "en stock" por una cantidad real que baja con cada compra y sube
-- con cada reventa), y las compras/reventas de la tienda ahora mueven la
-- tesorería del grupo: la compra es un ingreso, la recompra por reventa es
-- una salida (el GOCS le paga al soldado por devolver el ítem al arsenal).

-- ============================================================
-- Endurecer el ledger de tesorería: hasta ahora el trigger solo aplicaba el
-- delta de saldo en el INSERT. Si una fila se borra o edita directamente
-- (p.ej. desde un script con la service role key), el saldo queda
-- desincronizado para siempre porque nada revierte ese delta. Se agregan
-- las ramas UPDATE/DELETE para que el saldo sea siempre la suma real de
-- los movimientos vigentes.
-- ============================================================
create or replace function public.apply_treasury_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.treasury set balance = balance + new.amount, updated_at = now() where id = true;
    return new;
  elsif tg_op = 'UPDATE' then
    update public.treasury set balance = balance - old.amount + new.amount, updated_at = now() where id = true;
    return new;
  elsif tg_op = 'DELETE' then
    update public.treasury set balance = balance - old.amount, updated_at = now() where id = true;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists treasury_transactions_apply on public.treasury_transactions;
create trigger treasury_transactions_apply
  after insert or update or delete on public.treasury_transactions
  for each row execute function public.apply_treasury_transaction();

-- Corrección puntual: verificaciones anteriores contra la base en vivo
-- insertaron y luego borraron movimientos de prueba antes de que el
-- trigger reconociera DELETE, dejando el saldo desviado del historial real
-- (que hoy está vacío). Se recalcula desde la suma real de la tabla.
update public.treasury
set balance = (select coalesce(sum(amount), 0) from public.treasury_transactions), updated_at = now()
where id = true;

do $$
declare
  v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'public.treasury_transactions'::regclass and contype = 'c';

  if v_conname is not null then
    execute format('alter table public.treasury_transactions drop constraint %I', v_conname);
  end if;
end $$;

alter table public.treasury_transactions add constraint treasury_transactions_type_check check (
  type in ('ingreso', 'nomina', 'armamento', 'gastos_generales', 'ajuste', 'devolucion')
);

-- ============================================================
-- CATÁLOGO — stock numérico en vez de booleano.
-- ============================================================
alter table public.weapons add column stock int not null default 0 check (stock >= 0);
alter table public.equipment add column stock int not null default 0 check (stock >= 0);
alter table public.accessories add column stock int not null default 0 check (stock >= 0);
alter table public.vehicles add column stock int not null default 0 check (stock >= 0);

update public.weapons set stock = case when in_stock then 1 else 0 end;
update public.equipment set stock = case when in_stock then 1 else 0 end;
update public.accessories set stock = case when in_stock then 1 else 0 end;
update public.vehicles set stock = case when in_stock then 1 else 0 end;

comment on column public.weapons.stock is 'Unidades disponibles en el arsenal. Baja con cada compra, sube con cada reventa.';
comment on column public.equipment.stock is 'Unidades disponibles en el depósito. Baja con cada compra, sube con cada reventa.';
comment on column public.accessories.stock is 'Unidades disponibles en el depósito. Baja con cada compra, sube con cada reventa.';
comment on column public.vehicles.stock is 'Unidades disponibles en el motor pool. Baja con cada compra, sube con cada reventa.';

alter table public.weapons drop column in_stock;
alter table public.equipment drop column in_stock;
alter table public.accessories drop column in_stock;
alter table public.vehicles drop column in_stock;

-- ============================================================
-- purchase_item(): valida y descuenta stock numérico (bloqueado en la fila
-- con FOR UPDATE para evitar sobreventa por compras simultáneas), y
-- acredita el precio pagado como ingreso a la tesorería del GOCS.
-- ============================================================
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
  v_stock int;
  v_name text;
  v_category text;
  v_image_url text;
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
    'select price, stock, name, category, min_rank_sort_order, image_url from public.%I where id = $1 for update',
    p_item_table
  ) into v_price, v_stock, v_name, v_category, v_min_rank, v_image_url using p_item_id;

  if v_price is null then
    raise exception 'Ítem no encontrado';
  end if;

  if v_stock <= 0 then
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

  insert into public.inventory (profile_id, item_table, item_id, item_name, item_category, purchase_price, purchase_transaction_id, item_image_url)
  values (p_profile_id, p_item_table, p_item_id, v_name, v_category, v_price, v_txn.id, v_image_url);

  execute format('update public.%I set stock = stock - 1 where id = $1', p_item_table) using p_item_id;

  insert into public.treasury_transactions (type, amount, detail, created_by)
  values ('ingreso', v_price, format('Compra en tienda: %s (%s)', v_name, p_item_table), p_profile_id);

  return v_txn;
end;
$$;

revoke all on function public.purchase_item(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.purchase_item(uuid, text, uuid) to service_role;

-- ============================================================
-- sell_item(): al revender, el ítem vuelve al stock del catálogo y la
-- tesorería registra la salida de dinero (le pagó al soldado por
-- recomprarle el ítem), simétrico al ingreso que generó al comprarlo.
-- ============================================================
create or replace function public.sell_item(
  p_profile_id uuid,
  p_inventory_id uuid
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.inventory;
  v_txn public.transactions;
  v_txn_type text;
begin
  select * into v_item from public.inventory
  where id = p_inventory_id and profile_id = p_profile_id
  for update;

  if not found then
    raise exception 'Ítem no encontrado en el inventario';
  end if;

  v_txn_type := case when v_item.item_table = 'vehicles' then 'Venta Vehiculo' else 'Venta Armamento' end;

  insert into public.transactions (profile_id, type, detail, amount, notes)
  values (
    p_profile_id,
    v_txn_type,
    v_item.item_name,
    v_item.purchase_price,
    'Venta de inventario (' || v_item.item_table || ')'
  )
  returning * into v_txn;

  delete from public.inventory where id = p_inventory_id;

  execute format('update public.%I set stock = stock + 1 where id = $1', v_item.item_table) using v_item.item_id;

  insert into public.treasury_transactions (type, amount, detail, created_by)
  values (
    'devolucion',
    -v_item.purchase_price,
    format('Recompra de stock: %s (%s)', v_item.item_name, v_item.item_table),
    p_profile_id
  );

  return v_txn;
end;
$$;

revoke all on function public.sell_item(uuid, uuid) from public, anon, authenticated;
grant execute on function public.sell_item(uuid, uuid) to service_role;
