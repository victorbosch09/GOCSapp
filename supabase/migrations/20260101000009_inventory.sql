-- GOCS platform — inventario personal: cada compra pasa a formar parte del
-- inventario del soldado, que puede revenderlo (reembolso del precio pagado
-- y se quita del inventario).

alter table public.transactions drop constraint transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (
  type in (
    'Sueldo', 'Bono', 'Compra Armamento', 'Compra Vehiculo', 'Descuento',
    'Sancion', 'Ajuste Manual', 'Venta Armamento', 'Venta Vehiculo'
  )
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  item_table text not null check (item_table in ('weapons', 'equipment', 'accessories', 'vehicles')),
  item_id uuid not null,
  item_name text not null,
  item_category text,
  purchase_price numeric not null,
  acquired_at timestamptz not null default now(),
  purchase_transaction_id uuid references public.transactions (id) on delete set null
);

comment on table public.inventory is 'Ítems que cada soldado posee (comprados en la tienda). Se puede revender: reembolsa purchase_price y borra la fila.';

create index inventory_profile_id_idx on public.inventory (profile_id, acquired_at desc);

alter table public.inventory enable row level security;

create policy "inventory_select_own" on public.inventory
  for select using (profile_id = auth.uid());
create policy "inventory_select_command_staff" on public.inventory
  for select using (public.is_command_staff());

-- Sin policies de insert/update/delete: solo se modifica vía purchase_item()
-- y sell_item(), ambas SECURITY DEFINER llamadas con la service role key.

-- ============================================================
-- purchase_item(): ahora también registra el ítem en el inventario
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
  v_in_stock boolean;
  v_name text;
  v_category text;
  v_balance numeric;
  v_txn public.transactions;
  v_txn_type text;
begin
  if p_item_table not in ('weapons', 'equipment', 'accessories', 'vehicles') then
    raise exception 'Categoría de catálogo inválida: %', p_item_table;
  end if;

  execute format(
    'select price, in_stock, name, category from public.%I where id = $1 for share',
    p_item_table
  ) into v_price, v_in_stock, v_name, v_category using p_item_id;

  if v_price is null then
    raise exception 'Ítem no encontrado';
  end if;

  if not v_in_stock then
    raise exception 'Ítem sin stock disponible';
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
-- sell_item(): revende un ítem del inventario (reembolso total)
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

  return v_txn;
end;
$$;

revoke all on function public.sell_item(uuid, uuid) from public, anon, authenticated;
grant execute on function public.sell_item(uuid, uuid) to service_role;
