-- GOCS platform — core schema
-- Grupo Operacional Comando Sur: ranks, roster, catalog, economy, ops calendar.

create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- RANGOS
-- ============================================================
create table public.ranks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  abbreviation text not null,
  weekly_wage numeric not null default 0,
  description text,
  promotion_requirement text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.ranks is 'Escalafón GOCS: sueldo semanal base, descripción y requisito de ascenso por rango.';

-- ============================================================
-- PERFILES (1:1 con auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  callsign text not null,
  squad text,
  rank_id uuid references public.ranks (id),
  is_command_staff boolean not null default false,
  approved boolean not null default false,
  join_date date not null default current_date,
  avatar_url text,
  cached_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de operador. approved=false = Candidato en revisión, no ve el dashboard completo.';
comment on column public.profiles.cached_balance is 'Recalculado por trigger cada vez que se inserta/edita/borra una transacción del soldado.';

-- ============================================================
-- CATÁLOGO DE TIENDA
-- ============================================================
create table public.weapons (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  price numeric not null default 0,
  mag_price_standard numeric,
  mag_price_special numeric,
  capacity text,
  in_stock boolean not null default false,
  image_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  price numeric not null default 0,
  mag_price_standard numeric,
  mag_price_special numeric,
  capacity text,
  in_stock boolean not null default false,
  image_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.accessories (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  price numeric not null default 0,
  mag_price_standard numeric,
  mag_price_special numeric,
  capacity text,
  in_stock boolean not null default false,
  image_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- Transporte | Blindado | Aéreo | Logística
  name text not null,
  price numeric not null default 0,
  in_stock boolean not null default false,
  image_url text,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ECONOMÍA
-- ============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (
    type in ('Sueldo', 'Bono', 'Compra Armamento', 'Compra Vehiculo', 'Descuento', 'Sancion', 'Ajuste Manual')
  ),
  detail text,
  amount numeric not null, -- positivo = ingreso, negativo = egreso
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index transactions_profile_id_idx on public.transactions (profile_id, created_at desc);

create table public.contract_bonus_types (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  amount numeric not null,
  sort_order int not null default 0
);

comment on table public.contract_bonus_types is 'Catálogo editable de bonos fijos por logro de contrato (Infiltración, Extracción, etc).';

create table public.contract_risk_levels (
  id uuid primary key default gen_random_uuid(),
  level int not null unique,
  percentage numeric not null, -- informativo, sin fórmula automática aplicada
  sort_order int not null default 0
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  contract_date date not null default current_date,
  risk_level int, -- informativo, ver contract_risk_levels
  bonuses jsonb not null default '[]'::jsonb, -- array de labels de contract_bonus_types
  total_amount numeric not null default 0,
  logged_by uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now()
);

create index contracts_profile_id_idx on public.contracts (profile_id, created_at desc);

-- ============================================================
-- NOTIFICACIONES / RECOMPENSAS / SANCIONES
-- ============================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  target_type text not null check (target_type in ('all', 'profile', 'squad')),
  target_id text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  amount numeric,
  awarded_by uuid references public.profiles (id),
  awarded_at timestamptz not null default now()
);

create table public.sanction_types (
  id uuid primary key default gen_random_uuid(),
  severity text not null check (severity in ('leve', 'moderada', 'grave', 'muy grave', 'extrema')),
  label text not null,
  description text,
  sort_order int not null default 0
);

comment on table public.sanction_types is 'Taxonomía de sanciones del clan, editable por el admin (Sección Sanciones de la hoja original).';

create table public.sanctions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  sanction_type_id uuid references public.sanction_types (id),
  severity text not null check (severity in ('leve', 'moderada', 'grave', 'muy grave', 'extrema')),
  description text,
  amount_deducted numeric,
  applied_by uuid references public.profiles (id),
  applied_at timestamptz not null default now()
);

create index sanctions_profile_id_idx on public.sanctions (profile_id, applied_at desc);

-- ============================================================
-- CALENDARIO
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null check (event_type in ('entrenamiento', 'operacion', 'pago', 'otro')),
  start_at timestamptz not null,
  end_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index events_start_at_idx on public.events (start_at);

-- ============================================================
-- NÓMINA SEMANAL — LOG DE EJECUCIONES
-- ============================================================
create table public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  triggered_by uuid references public.profiles (id), -- null = automático (cron)
  profiles_paid int not null default 0,
  total_amount numeric not null default 0,
  status text not null default 'success' check (status in ('success', 'error')),
  notes text
);
