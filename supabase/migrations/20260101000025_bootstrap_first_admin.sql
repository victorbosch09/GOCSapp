-- Self-service bootstrap for the very first command-staff account.
-- Previously this required a hand-run SQL update in the Supabase dashboard.
-- Both functions are SECURITY DEFINER because a regular operator's RLS grant
-- on profiles only covers their own row (profiles_select_own) — they cannot
-- see whether any is_command_staff row exists at all otherwise.

create or replace function public.any_command_staff_exists()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where is_command_staff = true);
$$;

comment on function public.any_command_staff_exists() is
  'Lets an unapproved/non-staff client know whether the founder-access claim button should render. Leaks no data, only a boolean.';

grant execute on function public.any_command_staff_exists() to authenticated;

create or replace function public.bootstrap_first_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles where is_command_staff = true) then
    raise exception 'Ya existe un mando registrado. Pedile a un mando actual que te dé acceso desde Admin → Soldados.';
  end if;

  if auth.uid() is null then
    raise exception 'No autenticado.';
  end if;

  update public.profiles
  set is_command_staff = true, approved = true
  where id = auth.uid();

  if not found then
    raise exception 'Perfil no encontrado.';
  end if;
end;
$$;

comment on function public.bootstrap_first_admin() is
  'One-time self-promotion to command staff, only while zero command-staff rows exist. Re-checks the same condition inside the function body (not just the UI gate) so it cannot be raced or replayed once a founder exists.';

grant execute on function public.bootstrap_first_admin() to authenticated;
