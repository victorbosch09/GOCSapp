-- GOCS platform — habilitar Realtime en las tablas que el frontend escucha
-- (sección 8 del prompt maestro): saldo/pagos propios, notificaciones,
-- catálogo de tienda y calendario de eventos.

alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.weapons;
alter publication supabase_realtime add table public.equipment;
alter publication supabase_realtime add table public.accessories;
alter publication supabase_realtime add table public.vehicles;
alter publication supabase_realtime add table public.events;
