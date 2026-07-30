-- GOCS platform — permitir borrar la cuenta de un operador sin romper el
-- historial de acciones que ese operador realizó como mando (bonos que
-- cargó, eventos que creó, sanciones que aplicó, etc). Esas columnas pasan
-- a ON DELETE SET NULL: el registro histórico queda, solo se pierde la
-- referencia a "quién" lo hizo.

alter table public.contracts drop constraint contracts_logged_by_fkey;
alter table public.contracts add constraint contracts_logged_by_fkey
  foreign key (logged_by) references public.profiles (id) on delete set null;

alter table public.events drop constraint events_created_by_fkey;
alter table public.events add constraint events_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.notifications drop constraint notifications_created_by_fkey;
alter table public.notifications add constraint notifications_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

alter table public.payroll_runs drop constraint payroll_runs_triggered_by_fkey;
alter table public.payroll_runs add constraint payroll_runs_triggered_by_fkey
  foreign key (triggered_by) references public.profiles (id) on delete set null;

alter table public.rewards drop constraint rewards_awarded_by_fkey;
alter table public.rewards add constraint rewards_awarded_by_fkey
  foreign key (awarded_by) references public.profiles (id) on delete set null;

alter table public.sanctions drop constraint sanctions_applied_by_fkey;
alter table public.sanctions add constraint sanctions_applied_by_fkey
  foreign key (applied_by) references public.profiles (id) on delete set null;

alter table public.transactions drop constraint transactions_created_by_fkey;
alter table public.transactions add constraint transactions_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;
