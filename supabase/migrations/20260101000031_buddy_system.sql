-- Buddy System: dos operadores rango "Operador lvl1" forman equipo, adoptan
-- un aspirante (rango "Candidato"), lo entrenan y lo califican; el mando
-- otorga puntos y bonos al trío y decide cuándo graduarlo. El ascenso de
-- rango en sí sigue siendo manual desde /admin/soldados (como cualquier otro
-- cambio de rango) — "graduar" acá solo marca el trío como completado y
-- notifica al mando, no dispara un ascenso automático.

create table public.buddy_teams (
  id uuid primary key default gen_random_uuid(),
  operator_a_id uuid not null references public.profiles (id) on delete cascade,
  operator_b_id uuid not null references public.profiles (id) on delete cascade,
  aspirant_id uuid references public.profiles (id) on delete set null,
  status text not null default 'formando' check (
    status in ('formando', 'en_entrenamiento', 'listo_para_ascender', 'graduado', 'disuelto')
  ),
  mando_points int not null default 0,
  formed_at timestamptz not null default now(),
  graduated_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  check (operator_a_id <> operator_b_id)
);

comment on table public.buddy_teams is 'Buddy System: pareja de Operador lvl1 + un aspirante (Candidato) que entrenan juntos.';

create unique index buddy_teams_operator_a_active_idx on public.buddy_teams (operator_a_id)
  where status not in ('graduado', 'disuelto');
create unique index buddy_teams_operator_b_active_idx on public.buddy_teams (operator_b_id)
  where status not in ('graduado', 'disuelto');
create unique index buddy_teams_aspirant_active_idx on public.buddy_teams (aspirant_id)
  where status not in ('graduado', 'disuelto') and aspirant_id is not null;

create table public.buddy_activities (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.buddy_teams (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create table public.buddy_ratings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.buddy_teams (id) on delete cascade,
  rated_by uuid references public.profiles (id) on delete set null,
  score int not null check (score between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

create table public.buddy_bonuses (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.buddy_teams (id) on delete cascade,
  awarded_by uuid references public.profiles (id) on delete set null,
  amount numeric not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS — lectura abierta a todo aprobado (como el roster/equipo), escritura
-- acotada: cada operador solo puede tocar su propio trío, el mando todo.
-- ============================================================
alter table public.buddy_teams enable row level security;
alter table public.buddy_activities enable row level security;
alter table public.buddy_ratings enable row level security;
alter table public.buddy_bonuses enable row level security;

create policy "buddy_teams_select_approved" on public.buddy_teams
  for select to authenticated
  using (public.is_approved() or public.is_command_staff());

create policy "buddy_activities_select_approved" on public.buddy_activities
  for select to authenticated
  using (public.is_approved() or public.is_command_staff());

create policy "buddy_ratings_select_approved" on public.buddy_ratings
  for select to authenticated
  using (public.is_approved() or public.is_command_staff());

create policy "buddy_bonuses_select_approved" on public.buddy_bonuses
  for select to authenticated
  using (public.is_approved() or public.is_command_staff());

-- Todas las escrituras pasan por Server Actions con el admin client (mismo
-- patrón que el resto del código: la autorización se valida en la acción,
-- no en RLS), así que no hace falta abrir policies de insert/update para
-- `authenticated` — el rol admin las bypassea.
