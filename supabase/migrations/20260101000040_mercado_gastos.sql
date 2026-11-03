-- ============================================================
-- MERCADO INTERNACIONAL + GASTOS RECURRENTES
-- ============================================================

-- 1. MERCADO INTERNACIONAL
-- Catálogo de suministros disponibles para comprar al por mayor.
-- Solo Command Staff puede ver/usar esta sección.
create table public.market_items (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,               -- Armamento, Vehículos, Equipamiento, etc.
  name        text not null,
  description text,
  unit_cost   int  not null check (unit_cost > 0),  -- cr por unidad
  image_url   text,
  in_stock    boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Historial de compras del mercado
create table public.market_purchases (
  id              uuid primary key default gen_random_uuid(),
  market_item_id  uuid not null references public.market_items(id) on delete restrict,
  quantity        int  not null check (quantity > 0),
  unit_cost       int  not null,
  total_cost      int  not null,
  target_table    text,   -- 'weapons' | 'equipment' | 'accessories' | 'vehicles' | null
  target_item_id  uuid,   -- id del ítem de la tienda que recibe el stock
  purchased_by    uuid references public.profiles(id) on delete set null,
  notes           text,
  created_at      timestamptz not null default now()
);

-- 2. GASTOS RECURRENTES
create table public.recurring_expenses (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  category     text not null,       -- 'Seguro' | 'Infraestructura' | 'Logística' | 'Personal' | 'Intel'
  base_amount  int  not null check (base_amount >= 0),  -- monto fijo en cr
  -- Escalado dinámico: amount_total = base_amount + scale_rate * <count>
  scales_with  text,                -- null | 'soldiers' | 'vehicles' | 'weapons_stock'
  scale_rate   int  not null default 0,  -- cr adicionales por unidad escalada
  frequency    text not null default 'weekly' check (frequency in ('weekly','monthly')),
  is_active    boolean not null default true,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);

-- Pagos de gastos recurrentes
create table public.expense_payments (
  id             uuid primary key default gen_random_uuid(),
  expense_id     uuid not null references public.recurring_expenses(id) on delete cascade,
  amount_paid    int  not null,
  period_label   text not null,   -- e.g. "Semana 2026-11-03"
  paid_by        uuid references public.profiles(id) on delete set null,
  notes          text,
  created_at     timestamptz not null default now()
);

-- RLS
alter table public.market_items     enable row level security;
alter table public.market_purchases enable row level security;
alter table public.recurring_expenses  enable row level security;
alter table public.expense_payments    enable row level security;

-- Market: solo Command Staff puede ver y operar
create policy "market_items_cs_all" on public.market_items
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_command_staff = true));

create policy "market_purchases_cs_all" on public.market_purchases
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_command_staff = true));

-- Gastos: solo Command Staff
create policy "recurring_expenses_cs_all" on public.recurring_expenses
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_command_staff = true));

create policy "expense_payments_cs_all" on public.expense_payments
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_command_staff = true));

-- Extend TreasuryTransactionType to include new types
-- (handled in app layer via text column — already open-ended)

-- ── SEED: Market items ───────────────────────────────────────
insert into public.market_items (category, name, description, unit_cost, sort_order) values
  -- Fusiles
  ('Fusiles', 'M4A1 SOPMOD', 'Fusil de asalto estándar, configuración especial de operaciones.', 3500, 10),
  ('Fusiles', 'HK416 A5', 'Fusil de asalto de alto rendimiento, calibre 5.56.', 4200, 11),
  ('Fusiles', 'SCAR-H', 'Fusil battle rifle calibre 7.62, alto poder de detención.', 5800, 12),
  ('Fusiles', 'AK-74M', 'Plataforma 5.45 confiable, bajo costo de mantenimiento.', 2800, 13),
  -- Ametralladoras
  ('Ametralladoras', 'M249 SAW', 'Arma de apoyo ligero de escuadra, calibre 5.56.', 8500, 20),
  ('Ametralladoras', 'M240B', 'Ametralladora de propósito general calibre 7.62.', 12000, 21),
  ('Ametralladoras', 'Minimi MK3 Para', 'Versión paracaidista de la M249 con cañón plegable.', 9500, 22),
  -- AT / Antitanque
  ('Antitanque', 'RPG-7', 'Lanzacohetes de hombro de uso extendido, munición variada.', 6000, 30),
  ('Antitanque', 'M72A3 LAW', 'Cohete antitanque desechable, ligero y portátil.', 2500, 31),
  ('Antitanque', 'Javelin FGM-148', 'Misil antitanque guiado por imagen térmica.', 25000, 32),
  -- Escopetas
  ('Escopetas', 'Benelli M4 Super 90', 'Escopeta semiautomática táctica de 12 gauge.', 3200, 40),
  ('Escopetas', 'Mossberg 500 ATI', 'Escopeta de acción deslizante, versátil y robusta.', 2000, 41),
  -- Francotirador
  ('Fusiles de Precisión', 'Accuracy International AXMC', 'Rifle de precisión de largo alcance, calibre convertible.', 18000, 50),
  ('Fusiles de Precisión', 'Remington M40A5', 'Rifle de precisión estándar de marines, calibre .308.', 12000, 51),
  ('Fusiles de Precisión', 'CheyTac M200', 'Rifle de precisión extrema de muy largo alcance.', 28000, 52),
  -- Pistolas / Secundarias
  ('Armas Secundarias', 'Glock 17 Gen5', 'Pistola estándar de servicio, 9mm, alta confiabilidad.', 800, 60),
  ('Armas Secundarias', 'SIG Sauer P226', 'Pistola de alta precisión usada por fuerzas especiales.', 1200, 61),
  -- Equipamiento
  ('Equipamiento Táctico', 'Casco FAST Maritime', 'Casco balístico de perfil bajo para operadores.', 1800, 70),
  ('Equipamiento Táctico', 'Plate Carrier Crye JPC', 'Chaleco porta placas ligero y modular.', 2500, 71),
  ('Equipamiento Táctico', 'NVG AN/PVS-14', 'Intensificador de imagen nocturna monocular.', 6000, 72),
  ('Equipamiento Táctico', 'Radio Harris AN/PRC-152', 'Radio táctica multibanda de mano.', 4500, 73),
  ('Equipamiento Táctico', 'Kit de demolición C4', 'Paquete de explosivos plásticos con detonadores.', 3500, 74),
  ('Equipamiento Táctico', 'Mochila de asalto MOLLE', 'Sistema modular de carga para operaciones.', 900, 75),
  -- Vehículos
  ('Vehículos', 'Humvee M1151', 'Vehículo táctico ligero blindado, 4x4.', 45000, 80),
  ('Vehículos', 'Humvee M1151 + .50 cal', 'Humvee con torreta armada con ametralladora calibre .50.', 68000, 81),
  ('Vehículos', 'MRAP MaxxPro', 'Vehículo resistente a minas y emboscadas.', 120000, 82),
  ('Vehículos', 'Quad ATV Táctico', 'Cuatriciclo para reconocimiento y extracción rápida.', 18000, 83),
  ('Vehículos', 'Helicóptero MH-6 Little Bird', 'Helicóptero ligero de inserción/extracción de operadores.', 250000, 84),
  ('Vehículos', 'Lancha Zodiac CRRC', 'Embarcación de combate de goma para operaciones anfibias.', 35000, 85),
  -- Munición
  ('Munición y Explosivos', 'Caja 5.56 x1000 rds', 'Munición estándar para M4/M249.', 1200, 90),
  ('Munición y Explosivos', 'Caja 7.62 x500 rds', 'Munición 7.62 para M240/SCAR-H.', 1000, 91),
  ('Munición y Explosivos', 'Granada M67 x10', 'Granadas de fragmentación estándar de ejército.', 2500, 92),
  ('Munición y Explosivos', 'Granada de humo x20', 'Granadas de señalización y cobertura.', 1800, 93);

-- ── SEED: Gastos recurrentes por defecto ─────────────────────
insert into public.recurring_expenses (name, description, category, base_amount, scales_with, scale_rate, frequency, sort_order) values
  ('Seguro de Vida — Operadores',
   'Cobertura de seguro de vida para cada operador activo del clan. Cubre bajas en servicio y lesiones graves en operación.',
   'Seguro', 0, 'soldiers', 75, 'weekly', 10),

  ('Alquiler del Cuartel General',
   'Renta del servidor y sede de operaciones virtual del G.O.C.S. Costo fijo semanal independiente del personal.',
   'Infraestructura', 1500, null, 0, 'weekly', 20),

  ('Mantenimiento de Vehículos',
   'Servicio técnico, combustible y repuestos para cada vehículo en inventario activo. Sin mantenimiento, los vehículos quedan fuera de servicio.',
   'Logística', 0, 'vehicles', 150, 'weekly', 30),

  ('Reserva de Munición',
   'Reabastecimiento y almacenamiento de munición para entrenamiento y operaciones regulares del clan.',
   'Logística', 400, null, 0, 'weekly', 40),

  ('Licencia de Comunicaciones',
   'Infraestructura de radio, servidores de voz, cifrado y licencias de software de mando y control.',
   'Infraestructura', 600, null, 0, 'weekly', 50),

  ('Suministros Médicos',
   'Botiquines, medicamentos, equipos de estabilización y repuestos de material sanitario de combate.',
   'Logística', 200, 'soldiers', 25, 'weekly', 60),

  ('Inteligencia y Reconocimiento',
   'Suscripción a fuentes de inteligencia, análisis de zona de operaciones, drones de reconocimiento y actualización de mapas.',
   'Intel', 800, null, 0, 'weekly', 70),

  ('Mantenimiento de Armamento',
   'Limpieza, lubricación, piezas de repuesto y revisión de fiabilidad de cada arma en el inventario de la tienda.',
   'Logística', 0, 'weapons_stock', 30, 'weekly', 80),

  ('Fondo de Repatriación',
   'Reserva mensual para cubrir costos de extracción y repatriación de operadores heridos o capturados en misión.',
   'Seguro', 2000, null, 0, 'monthly', 90),

  ('Entrenamiento Externo y Certificaciones',
   'Cursos especializados externos, instructores invitados y certificaciones de habilidades avanzadas para el personal.',
   'Personal', 1200, null, 0, 'monthly', 100);
