-- Reventa de inventario pagaba el 100% del precio original — ahora paga
-- 50%, redondeado. La tesorería solo sale con lo que realmente se le paga
-- al soldado (la otra mitad queda como "depreciación" a favor del clan),
-- en vez de devolver el ingreso original completo.

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
  v_refund numeric;
begin
  select * into v_item from public.inventory
  where id = p_inventory_id and profile_id = p_profile_id
  for update;

  if not found then
    raise exception 'Ítem no encontrado en el inventario';
  end if;

  v_txn_type := case when v_item.item_table = 'vehicles' then 'Venta Vehiculo' else 'Venta Armamento' end;
  v_refund := round(v_item.purchase_price * 0.5);

  insert into public.transactions (profile_id, type, detail, amount, notes)
  values (
    p_profile_id,
    v_txn_type,
    v_item.item_name,
    v_refund,
    format('Venta de inventario (%s) — 50%% del precio pagado (%s)', v_item.item_table, v_item.purchase_price)
  )
  returning * into v_txn;

  delete from public.inventory where id = p_inventory_id;

  execute format('update public.%I set stock = stock + 1 where id = $1', v_item.item_table) using v_item.item_id;

  insert into public.treasury_transactions (type, amount, detail, created_by)
  values (
    'devolucion',
    -v_refund,
    format('Recompra de stock (50%%): %s (%s)', v_item.item_name, v_item.item_table),
    p_profile_id
  );

  return v_txn;
end;
$$;

revoke all on function public.sell_item(uuid, uuid) from public, anon, authenticated;
grant execute on function public.sell_item(uuid, uuid) to service_role;
