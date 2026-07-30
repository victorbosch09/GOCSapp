-- GOCS platform — asistencia (RSVP de Discord vs asistencia real),
-- entrenamiento (habilidades / evaluaciones / material de estudio),
-- y vínculo transacción<->reward/sanción/contrato para permitir
-- edición y borrado completo desde el panel de mando.

-- ============================================================
-- VÍNCULO CON TRANSACCIONES (para editar/borrar sin perder consistencia)
-- ============================================================
alter table public.rewards add column transaction_id uuid references public.transactions (id) on delete set null;
alter table public.sanctions add column transaction_id uuid references public.transactions (id) on delete set null;
alter table public.contracts add column transaction_id uuid references public.transactions (id) on delete set null;

-- ============================================================
-- ASISTENCIA
-- ============================================================
create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  response text not null check (response in ('asiste', 'tal_vez', 'no_asiste')),
  responded_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

comment on table public.event_rsvps is 'Respuesta del soldado en Discord: asiste / tal vez / no asiste. Autoreportado.';

create table public.event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  attended boolean not null default false,
  marked_by uuid references public.profiles (id) on delete set null,
  marked_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

comment on table public.event_attendance is 'Asistencia REAL, cargada por el mando/instructor luego de la actividad. Usada para condicionar el sueldo semanal.';

alter table public.event_rsvps enable row level security;
alter table public.event_attendance enable row level security;

create policy "event_rsvps_select_approved" on public.event_rsvps
  for select using (public.is_approved() or public.is_command_staff());
create policy "event_rsvps_upsert_own" on public.event_rsvps
  for insert with check (profile_id = auth.uid());
create policy "event_rsvps_update_own" on public.event_rsvps
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "event_rsvps_write_command_staff" on public.event_rsvps
  for all using (public.is_command_staff()) with check (public.is_command_staff());

create policy "event_attendance_select_approved" on public.event_attendance
  for select using (public.is_approved() or public.is_command_staff());
create policy "event_attendance_write_command_staff" on public.event_attendance
  for all using (public.is_command_staff()) with check (public.is_command_staff());

-- ============================================================
-- ENTRENAMIENTO — habilidades, evaluaciones, material de estudio
-- ============================================================
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text, -- 'Modulo' | 'Curso especializado' | 'Certificacion' | ...
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.skill_evaluations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  result text not null check (result in ('aprobado', 'no_aprobado', 'en_progreso')),
  score numeric,
  notes text,
  evaluated_by uuid references public.profiles (id) on delete set null,
  evaluated_at timestamptz not null default now()
);

comment on table public.skill_evaluations is 'Hoja de vida del operador: evaluaciones cargadas por instructores/mando por módulo o habilidad.';

create table public.training_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text,
  category text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.training_materials is 'Biblioteca de material de estudio, visible para todos los aprobados.';

alter table public.skills enable row level security;
alter table public.skill_evaluations enable row level security;
alter table public.training_materials enable row level security;

create policy "skills_select_approved" on public.skills
  for select using (public.is_approved() or public.is_command_staff());
create policy "skills_write_command_staff" on public.skills
  for all using (public.is_command_staff()) with check (public.is_command_staff());

create policy "skill_evaluations_select_own" on public.skill_evaluations
  for select using (profile_id = auth.uid());
create policy "skill_evaluations_select_command_staff" on public.skill_evaluations
  for select using (public.is_command_staff());
create policy "skill_evaluations_write_command_staff" on public.skill_evaluations
  for all using (public.is_command_staff()) with check (public.is_command_staff());

create policy "training_materials_select_approved" on public.training_materials
  for select using (public.is_approved() or public.is_command_staff());
create policy "training_materials_write_command_staff" on public.training_materials
  for all using (public.is_command_staff()) with check (public.is_command_staff());

-- ============================================================
-- FALTABAN: policies de update/delete para rewards (ya existían en
-- transactions/sanctions/events, pero no en rewards)
-- ============================================================
create policy "rewards_update_command_staff" on public.rewards
  for update using (public.is_command_staff()) with check (public.is_command_staff());
create policy "rewards_delete_command_staff" on public.rewards
  for delete using (public.is_command_staff());
