-- GOCS platform — el inventario también guarda una foto de la imagen del
-- ítem al momento de la compra (consistente con el resto de los campos
-- que ya son snapshot: nombre, categoría, precio pagado).

alter table public.inventory add column item_image_url text;

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
    'select price, in_stock, name, category, min_rank_sort_order, image_url from public.%I where id = $1 for share',
    p_item_table
  ) into v_price, v_in_stock, v_name, v_category, v_min_rank, v_image_url using p_item_id;

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

  insert into public.inventory (profile_id, item_table, item_id, item_name, item_category, purchase_price, purchase_transaction_id, item_image_url)
  values (p_profile_id, p_item_table, p_item_id, v_name, v_category, v_price, v_txn.id, v_image_url);

  return v_txn;
end;
$$;

revoke all on function public.purchase_item(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.purchase_item(uuid, text, uuid) to service_role;
