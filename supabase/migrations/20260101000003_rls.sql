-- GOCS platform — Row Level Security
-- Todas las escrituras que afectan saldos pasan por funciones SECURITY DEFINER
-- (service_role) desde Server Actions; el cliente autenticado solo tiene SELECT.

alter table public.ranks enable row level security;
alter table public.profiles enable row level security;
alter table public.weapons enable row level security;
alter table public.equipment enable row level security;
alter table public.accessories enable row level security;
alter table public.vehicles enable row level security;
alter table public.transactions enable row level security;
alter table public.contract_bonus_types enable row level security;
alter table public.contract_risk_levels enable row level security;
alter table public.contracts enable row level security;
alter table public.notifications enable row level security;
alter table public.rewards enable row level security;
alter table public.sanction_types enable row level security;
alter table public.sanctions enable row level security;
alter table public.events enable row level security;
alter table public.payroll_runs enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_select_command_staff" on public.profiles
  for select using (public.is_command_staff());

create policy "profiles_all_command_staff" on public.profiles
  for all using (public.is_command_staff()) with check (public.is_command_staff());

-- ============================================================
-- CATÁLOGOS DE SOLO LECTURA PARA APROBADOS, ESCRITURA SOLO MANDO
-- ============================================================
create policy "ranks_select_approved" on public.ranks
  for select using (public.is_approved() or public.is_command_staff());
create policy "ranks_write_command_staff" on public.ranks
  for all using (public.is_command_staff()) with check (public.is_command_staff());

create policy "weapons_select_approved" on public.weapons
  for select using (public.is_approved() or public.is_command_staff());
create policy "weapons_write_command_staff" on public.weapons
  for all using (public.is_command_staff()) with check (public.is_command_staff());

create policy "equipment_select_approved" on public.equipment
  for select using (public.is_approved() or public.is_command_staff());
create policy "equipment_write_command_staff" on public.equipment
  for all using (public.is_command_staff()) with check (public.is_command_staff());

create policy "accessories_select_approved" on public.accessories
  for select using (public.is_approved() or public.is_command_staff());
create policy "accessories_write_command_staff" on public.accessories
  for all using (public.is_command_staff()) with check (public.is_command_staff());

create policy "vehicles_select_approved" on public.vehicles
  for select using (public.is_approved() or public.is_command_staff());
create policy "vehicles_write_command_staff" on public.vehicles
  for all using (public.is_command_staff()) with check (public.is_command_staff());

create policy "bonus_types_select_approved" on public.contract_bonus_types
  for select using (public.is_approved() or public.is_command_staff());
create policy "bonus_types_write_command_staff" on public.contract_bonus_types
  for all using (public.is_command_staff()) with check (public.is_command_staff());

create policy "risk_levels_select_approved" on public.contract_risk_levels
  for select using (public.is_approved() or public.is_command_staff());
create policy "risk_levels_write_command_staff" on public.contract_risk_levels
  for all using (public.is_command_staff()) with check (public.is_command_staff());

create policy "sanction_types_select_approved" on public.sanction_types
  for select using (public.is_approved() or public.is_command_staff());
create policy "sanction_types_write_command_staff" on public.sanction_types
  for all using (public.is_command_staff()) with check (public.is_command_staff());

-- ============================================================
-- ECONOMÍA PERSONAL — solo el propio soldado o el mando
-- (sin policies de insert/update/delete: esas mutaciones van siempre
-- por funciones SECURITY DEFINER llamadas con la service role key)
-- ============================================================
create policy "transactions_select_own" on public.transactions
  for select using (profile_id = auth.uid());
create policy "transactions_select_command_staff" on public.transactions
  for select using (public.is_command_staff());
create policy "transactions_write_command_staff" on public.transactions
  for insert with check (public.is_command_staff());
create policy "transactions_update_command_staff" on public.transactions
  for update using (public.is_command_staff()) with check (public.is_command_staff());
create policy "transactions_delete_command_staff" on public.transactions
  for delete using (public.is_command_staff());

create policy "contracts_select_own" on public.contracts
  for select using (profile_id = auth.uid());
create policy "contracts_select_command_staff" on public.contracts
  for select using (public.is_command_staff());

create policy "rewards_select_own" on public.rewards
  for select using (profile_id = auth.uid());
create policy "rewards_select_command_staff" on public.rewards
  for select using (public.is_command_staff());
create policy "rewards_write_command_staff" on public.rewards
  for insert with check (public.is_command_staff());

create policy "sanctions_select_own" on public.sanctions
  for select using (profile_id = auth.uid());
create policy "sanctions_select_command_staff" on public.sanctions
  for select using (public.is_command_staff());
create policy "sanctions_write_command_staff" on public.sanctions
  for insert with check (public.is_command_staff());
create policy "sanctions_update_command_staff" on public.sanctions
  for update using (public.is_command_staff()) with check (public.is_command_staff());
create policy "sanctions_delete_command_staff" on public.sanctions
  for delete using (public.is_command_staff());

-- ============================================================
-- NOTIFICACIONES — dirigidas a mí, mi squad o a todos
-- ============================================================
create policy "notifications_select_targeted" on public.notifications
  for select using (
    target_type = 'all'
    or (target_type = 'profile' and target_id = auth.uid()::text)
    or (target_type = 'squad' and target_id = public.my_squad())
    or public.is_command_staff()
  );
create policy "notifications_write_command_staff" on public.notifications
  for insert with check (public.is_command_staff());
create policy "notifications_delete_command_staff" on public.notifications
  for delete using (public.is_command_staff());

-- ============================================================
-- CALENDARIO — lectura para todos los aprobados, escritura mando
-- ============================================================
create policy "events_select_approved" on public.events
  for select using (public.is_approved() or public.is_command_staff());
create policy "events_write_command_staff" on public.events
  for all using (public.is_command_staff()) with check (public.is_command_staff());

-- ============================================================
-- LOG DE NÓMINA — solo mando
-- ============================================================
create policy "payroll_runs_select_command_staff" on public.payroll_runs
  for select using (public.is_command_staff());
