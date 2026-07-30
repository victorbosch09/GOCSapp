-- GOCS platform — log_contract() ahora vincula cada contrato con su
-- transacción de bono, para poder borrar/corregir un contrato cargado por
-- error sin dejar el saldo desincronizado.

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
  v_txn public.transactions;
begin
  foreach v_profile_id in array p_profile_ids loop
    insert into public.transactions (profile_id, type, detail, amount, notes, created_by)
    values (
      v_profile_id,
      'Bono',
      'Bono de contrato',
      p_total_amount,
      p_notes,
      p_logged_by
    )
    returning * into v_txn;

    insert into public.contracts (profile_id, risk_level, bonuses, total_amount, logged_by, notes, transaction_id)
    values (v_profile_id, p_risk_level, p_bonuses, p_total_amount, p_logged_by, p_notes, v_txn.id)
    returning * into v_contract;

    return next v_contract;
  end loop;
end;
$$;

revoke all on function public.log_contract(uuid[], int, jsonb, numeric, uuid, text) from public, anon, authenticated;
grant execute on function public.log_contract(uuid[], int, jsonb, numeric, uuid, text) to service_role;
