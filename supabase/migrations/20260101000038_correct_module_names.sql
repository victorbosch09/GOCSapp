-- Sync module names with the official Discord roles (source of truth).
-- Changes from previous naming:
--   Mod 4:  "Aerotransportada" (drop "Operaciones" prefix)
--   Mod 6:  "Convoy y Maniobras Motorizadas"     (was Reconocimiento y Vigilancia)
--   Mod 7:  "Movimientos MOUT"                    (was Navegación Táctica)
--   Mod 9:  "Interacción Civil y VIP"             (was Interacción Civil y ROE)
--   Mod 10: "Reconocimiento e Inteligencia"       (was Logística y Apoyo)

update public.skills set
  name        = 'Mod 4 — Aerotransportada',
  description = 'Inserción y extracción en helicóptero, zona de aterrizaje (LZ), seguridad perimetral y CASEVAC aéreo.'
where name in (
  'Mod 4', 'Mod 4 — Aerotransportada', 'Mod 4 — Operaciones Aerotransportadas'
);

update public.skills set
  name        = 'Mod 6 — Convoy y Maniobras Motorizadas',
  description = 'Conducción táctica en convoy, reacción a emboscada motorizada, bounding overwatch vehicular y comunicaciones en movimiento.'
where name in (
  'Mod 6', 'Mod 6 — Reconocimiento y Vigilancia', 'Mod 6 — Convoy y Maniobras Motorizadas'
);

update public.skills set
  name        = 'Mod 7 — Movimientos MOUT',
  description = 'Combate en entorno urbano (MOUT): limpieza de calles, seguridad de intersecciones, stacking y coordinación entre elementos en estructuras.'
where name in (
  'Mod 7', 'Mod 7 — Navegación Táctica', 'Mod 7 — Movimientos MOUT'
);

update public.skills set
  name        = 'Mod 9 — Interacción Civil y VIP',
  description = 'Protocolo de trato a civiles, extracción y protección de VIP, control de masas y reglas de enfrentamiento en zonas pobladas.'
where name in (
  'Mod 9', 'Mod 9 — Interacción Civil y ROE', 'Mod 9 — Interacción Civil y VIP'
);

update public.skills set
  name        = 'Mod 10 — Reconocimiento e Inteligencia',
  description = 'Patrullaje encubierto, reporte de inteligencia, observación de objetivos, patrón de vida y uso de óptica táctica y drones de reconocimiento.'
where name in (
  'Mod 10', 'Mod 10 — Logística y Apoyo', 'Mod 10 — Reconocimiento e Inteligencia'
);
