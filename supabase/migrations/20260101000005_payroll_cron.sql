-- GOCS platform — nómina semanal automática vía pg_cron
--
-- Si esta migración falla al aplicarla porque pg_cron no está habilitado,
-- activá la extensión "pg_cron" desde el Dashboard de Supabase
-- (Database → Extensions) y volvé a correr esta migración.

create extension if not exists pg_cron with schema extensions;

-- Corre todos los lunes a las 00:05 (hora del servidor de la base de datos).
-- cron.schedule() hace upsert por nombre de job, así que re-correr esta
-- migración simplemente actualiza el horario en vez de duplicar el job.
select cron.schedule(
  'gocs-weekly-payroll',
  '5 0 * * 1',
  $$ select public.run_weekly_payroll(null); $$
);
