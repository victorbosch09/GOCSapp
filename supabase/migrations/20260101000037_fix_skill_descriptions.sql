-- Fix placeholder skill descriptions left over from seed.sql.
-- Updates both the name (to match migration 033) and the description for all modules and courses.

update public.skills set
  name        = 'Mod 1 — Controles Básicos y Organización',
  description = 'Fundamentos de la plataforma: controles, HUD, comunicaciones por radio, formaciones básicas y protocolo de unidad.'
where name in ('Mod 1', 'Mod 1 — Controles Básicos y Organización');

update public.skills set
  name        = 'Mod 2 — Saltos, Repliegues y CQB Básico',
  description = 'Técnicas de paracaidismo táctico, repliegues bajo fuego y fundamentos de combate en espacios cerrados (CQB).'
where name in ('Mod 2', 'Mod 2 — Saltos, Repliegues y CQB Básico');

update public.skills set
  name        = 'Mod 3 — CQB Avanzado',
  description = 'Limpieza de habitaciones, stacking, bounding, uso de granadas en interiores y coordinación en pisos múltiples.'
where name in ('Mod 3', 'Mod 3 — CQB Avanzado');

update public.skills set
  name        = 'Mod 4 — Operaciones Aerotransportadas',
  description = 'Inserción y extracción en helicóptero, zona de aterrizaje (LZ), seguridad perimetral y CASEVAC aéreo.'
where name in ('Mod 4', 'Mod 4 — Aerotransportada', 'Mod 4 — Operaciones Aerotransportadas');

update public.skills set
  name        = 'Mod 5 — Movimientos de Equipo y Coordinación',
  description = 'Formaciones de patrulla, bounding overwatch, fire-and-maneuver, coordinación entre elementos de asalto y apoyo.'
where name in ('Mod 5', 'Mod 5 — Movimientos de Equipo y Coordinación');

update public.skills set
  name        = 'Mod 6 — Reconocimiento y Vigilancia',
  description = 'Técnicas de observación, patrullaje encubierto, reporte de inteligencia y uso de óptica táctica.'
where name in ('Mod 6', 'Mod 6 — Reconocimiento y Vigilancia');

update public.skills set
  name        = 'Mod 7 — Navegación Táctica',
  description = 'Lectura de mapa, azimuts, pace count, navegación nocturna y waypoints en entorno de combate.'
where name in ('Mod 7', 'Mod 7 — Navegación Táctica');

update public.skills set
  name        = 'Mod 8 — Asalto y Defensa',
  description = 'Planificación y ejecución de asaltos a objetivos, preparación de posiciones defensivas y contraataque.'
where name in ('Mod 8', 'Mod 8 — Asalto y Defensa');

update public.skills set
  name        = 'Mod 9 — Interacción Civil y ROE',
  description = 'Reglas de enfrentamiento, identificación de objetivos (PID), trato a civiles y manejo de prisioneros.'
where name in ('Mod 9', 'Mod 9 — Interacción Civil y ROE');

update public.skills set
  name        = 'Mod 10 — Logística y Apoyo',
  description = 'Cadena de suministro, gestión de munición y equipamiento, evacuaciones y reabastecimiento en misión.'
where name in ('Mod 10', 'Mod 10 — Logística y Apoyo');

update public.skills set
  name        = 'Mod 11 — Comunicaciones Avanzadas',
  description = 'Redes de radio, cifrado, brevity codes, protocolo MEDEVAC/CASEVAC y SITREP bajo presión.'
where name in ('Mod 11', 'Mod 11 — Comunicaciones Avanzadas');

-- Cursos especializados
update public.skills set
  description = 'Conocimiento profundo del rol asignado: funciones tácticas, equipamiento y responsabilidades dentro del equipo.'
where name = 'Curso Rol Especializado';

update public.skills set
  description = 'Atención pre-hospitalaria en combate: torniquetes, vendajes de presión, protocolo MARCH y evacuación de bajas bajo fuego.'
where name = 'Primeros Auxilios';

update public.skills set
  description = 'Manejo, posicionamiento y doctrina del arma de apoyo de fuego pesado. Sectores de tiro, puntos de anclaje y coordinación con el equipo.'
where name = 'Ametrallador';

update public.skills set
  description = 'Empleo del lanzagranadas bajo cañón y granadas de mano: ángulos de tiro, efectos de fuego indirecto y seguridad en combate cercano.'
where name = 'Granadero';

update public.skills set
  description = 'Descenso en rappel desde estructuras y helicópteros: nudo de seguridad, control de descenso y transición al combate al pie.'
where name = 'Rappel';

update public.skills set
  description = 'Certificación de puntería y manejo de arma: recargas tácticas, cambio de posición bajo fuego y dominio del gatillo bajo estrés.'
where name = 'Experto en Shooting Drill';

update public.skills set
  description = 'Empleo del rifle de precisión: rangefinding, compensación de viento y elevación, hide site y extracción encubierta.'
where name = 'Francotirador';

update public.skills set
  description = 'Reconocimiento y señalamiento de objetivos con drones tácticos. Integración con el equipo de tierra y protocolo de zona aérea.'
where name = 'Operador de Drones';

update public.skills set
  description = 'Conducción de vehículos en zona de combate: convoy, bounding overwatch, recuperación de vehículo inutilizado y reacción a emboscada.'
where name = 'Conductor Táctico';

-- Cursos de liderazgo
update public.skills set
  name        = 'Curso Líder de Equipo',
  description = 'Liderazgo de fireteam: toma de decisiones bajo presión, gestión de efectivos, delegación táctica y comunicación de órdenes.'
where name in ('Curso Lider de Equipo', 'Curso Líder de Equipo');

update public.skills set
  name        = 'Curso Líder de Escuadra',
  description = 'Mando de escuadra completa: coordinación de fireteams, planificación de patrullas, briefs de operación y evaluación post-misión.'
where name in ('Curso Lider de Escuadra', 'Curso Líder de Escuadra');

-- Cursos de especialista avanzado
update public.skills set
  description = 'Control terminal aéreo: CAS, MEDEVAC, marcación de LZ y Call For Fire con aeronaves de ala fija y rotativa.'
where name = 'JTAC';

update public.skills set
  description = 'Azimuts, pace count, resección, rangefinding y balística de precisión (MOA/mil, viento, corrección de Coriolis).'
where name = 'Navegación y Tiro de Precisión';

update public.skills set
  description = 'Combate en estructuras urbanas: breaching, subterráneo, rooftop, colapso estructural y coordinación de stacks.'
where name = 'MOUT Avanzado';

update public.skills set
  description = 'PID, escalada de fuerza, patrón de vida, ciclo de inteligencia y principio de proporcionalidad en ROE.'
where name = 'Inteligencia Táctica y ROE';

update public.skills set
  description = 'Seguridad de comunicaciones (COMSEC), triage logístico, prioridad de reabastecimiento y brevity codes operacionales.'
where name = 'Logística y COMSEC';
