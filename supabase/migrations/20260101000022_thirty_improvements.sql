-- GOCS platform — lote de 30 mejoras. Solo dos requieren cambios de schema:
-- lectura de notificaciones (leído/no leído) y expiración opcional de
-- sanciones (vigente/vencida). El resto son consultas/filtros/UI sobre
-- datos que ya existen.

-- ============================================================
-- NOTIFICATION_READS — marca de lectura por operador y notificación.
-- ============================================================
create table public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (notification_id, profile_id)
);

comment on table public.notification_reads is 'Qué operador ya leyó qué notificación. Sin fila = no leída.';

create index notification_reads_profile_id_idx on public.notification_reads (profile_id);

alter table public.notification_reads enable row level security;

create policy "notification_reads_select_own" on public.notification_reads
  for select using (profile_id = auth.uid());
create policy "notification_reads_insert_own" on public.notification_reads
  for insert with check (profile_id = auth.uid());

-- ============================================================
-- SANCIONES — expiración opcional (vigente vs. vencida).
-- ============================================================
alter table public.sanctions add column expires_at timestamptz;

comment on column public.sanctions.expires_at is 'Si se define, la sanción se considera vencida después de esta fecha. NULL = sin vencimiento (permanente).';
