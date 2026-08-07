-- GOCS platform -- seed data (fuente: prompt maestro + economia_clan.xlsx)
-- Idempotente: se puede re-ejecutar sin duplicar filas.

insert into public.ranks (name, abbreviation, weekly_wage, description, promotion_requirement, sort_order) values
  ('Candidato', 'Can', 500, 'Aspirante en proceso de selección e instrucción. Durante esta etapa adquiere los conocimientos básicos de doctrina, procedimientos y disciplina necesarios para integrarse al Grupo Operacional Comando Sur.', 'Finalizar proceso de admision.', 1),
  ('Operador lvl1', 'ON-1', 850, 'Operador certificado para participar en operaciones. Ejecuta las tareas asignadas aplicando los procedimientos establecidos y trabaja bajo la supervisión del personal de mando.', 'Mod 1-4 y 4 contratos cumplidos.', 2),
  ('Operador lvl2', 'ON-2', 1200, 'Operador con experiencia que demuestra un dominio sólido de la doctrina institucional. Es capaz de asumir mayores responsabilidades y apoyar el desarrollo de operadores de menor experiencia.', '8 contratos cumplidos.', 3),
  ('Operador Senior', 'ON-S', 1750, 'Representa el más alto nivel del personal operativo. Su experiencia lo convierte en un referente dentro de la unidad, participando en la planificación, el entrenamiento y la ejecución de operaciones de alta complejidad.', '16 contratos cumplidos.', 4),
  ('Especialista lvl1', 'EN-1', 2250, 'Operador certificado en una especialidad táctica específica, aportando capacidades técnicas que fortalecen el desempeño de la unidad durante las operaciones.', 'Mod 5-8, Curso rol esp. y 5 contratos cumplidos en ON-S.', 5),
  ('Especialista lvl2', 'EN-2', 2850, 'Especialista con experiencia comprobada en su área. Participa en la planificación y ejecución de procedimientos especializados, brindando asesoramiento técnico cuando la misión lo requiere.', '3 Curso rol esp. y 5 contratos cumplidos en EN-1.', 6),
  ('Especialista Senior', 'EN-S', 4000, 'Máxima autoridad técnica dentro de una especialidad. Es responsable de mantener los estándares de capacitación, supervisar procedimientos y garantizar el empleo adecuado de las capacidades especializadas.', 'Modulos 9-11, 5 Cursos de Rol especializado, 10 contratos cumplidos como EN-2.', 7),
  ('Lider de equipo', 'LE', 5000, 'Responsable de dirigir una escuadra durante las operaciones. Coordina los movimientos del equipo, distribuye tareas y asegura el cumplimiento de la misión siguiendo la doctrina del GOCS.', 'Curso Lider de equipo, 8 contratos cumplidos como EN-S.', 8),
  ('Lider de escuadra', 'LP', 6250, 'Supervisa múltiples escuadras durante una operación. Coordina las maniobras, mantiene la comunicación con el Estado Mayor y adapta la ejecución del plan conforme evoluciona la situación táctica.', 'Curso Lider de escuadra, 10 contratos como LE, votacion grupal.', 9),
  ('Director de Operaciones', 'DOCS', 8500, 'Responsable del planeamiento, coordinación y supervisión de las operaciones del GOCS. Administra los recursos operacionales y garantiza que las misiones se desarrollen conforme a la doctrina de la organización.', NULL, 10),
  ('Director Ejecutivo', 'DECS', 12000, 'Máxima autoridad del Grupo Operacional Comando Sur. Define la dirección estratégica de la organización, supervisa su administración y establece los lineamientos que orientan el crecimiento y desarrollo institucional.', NULL, 11)
on conflict (name) do update set abbreviation = excluded.abbreviation, weekly_wage = excluded.weekly_wage, description = excluded.description, promotion_requirement = excluded.promotion_requirement, sort_order = excluded.sort_order;

insert into public.weapons (category, name, price, mag_price_standard, mag_price_special, capacity, stock) values
  ('Fusiles', 'Bacon M4 URG-I', 2500, 350, 700, NULL, 5),
  ('Fusiles', 'Bacon M4 SBR', 3000, 350, 700, NULL, 5),
  ('Fusiles', 'MK47 16 pulgadas', 4900, 350, 700, NULL, 0),
  ('Fusiles', 'MK47 10 pulgadas', 4800, 350, 700, NULL, 5),
  ('Fusiles', 'MCX', 5100, 350, 700, NULL, 0),
  ('Fusiles', 'SIG CSAW', 6300, 500, 1000, NULL, 5),
  ('Fusiles', 'SIG CSAW UNCAG', 6700, 500, 1000, NULL, 0),
  ('Fusiles', 'SIG RSAR UNCAG', 6800, 500, 1000, NULL, 0),
  ('Fusiles', 'SOLGW MK1 CAR', 4600, 350, 700, NULL, 0),
  ('Fusiles', 'SOLGW MK1 UNCAG', 5900, 350, 700, NULL, 0),
  ('Fusiles', 'S&T MOTIV K2C2 MLOK', 4600, 350, 700, NULL, 0),
  ('Fusiles', 'S&T MOTIV K2C2 SI', 4300, 350, 700, NULL, 0),
  ('Fusiles', 'S&T MOTIV K2C2 MKH', 4500, 350, 700, NULL, 0),
  ('Fusiles', 'FN HERSTAL ARKA', 6100, 350, 700, NULL, 0),
  ('Fusiles', 'FN HERSTAL ARKA UNCAG', 6500, 350, 700, NULL, 0),
  ('Fusiles', 'DDefense DDM4V7', 5800, 350, 700, NULL, 0),
  ('Fusiles', 'DD DDM4V7S', 4700, 350, 700, NULL, 0),
  ('Fusiles', 'DD DDM4V7 LE', 6000, 350, 700, NULL, 0),
  ('Fusiles', 'LMT MK24 MRGG-A', 8500, 500, 1000, NULL, 0),
  ('Fusiles', 'LMT MK24 MRGG-A UNCAG', 10400, 500, 1000, NULL, 0),
  ('Tirador', 'UAR-10', 12500, 800, 1600, '12 cargadores', 0),
  ('Tirador', 'Barret M82', 30000, 1500, 3000, '14 cargadores', 0),
  ('Ametrallador', 'Minimi MK3', 15000, 1000, 2000, '4 cargadores', 0),
  ('AT', 'M4 MAAWS', 20000, 6000, 12000, '3 municiones', 0),
  ('AT', 'M72A3 LAW', 6500, NULL, NULL, 'Uso unico', 0),
  ('Pistolas', 'TT Innovations JW4 Pit Viper', 1600, 80, 160, '5 cargadores', 0),
  ('Pistolas', 'TT Innovations UNCAG Pit', 2000, 80, 160, NULL, 0),
  ('Pistolas', 'FN Five-seveN MK3 TR', 1280, 80, 160, NULL, 0),
  ('Pistolas', 'Glock 17 Gen4', 1200, 80, 160, NULL, 5),
  ('Pistolas', 'Glock 17 Gen4 Mod.', 1300, 80, 160, NULL, 0);

insert into public.equipment (category, name, price, stock) values
  ('Casco', 'REC EXFIL Ballistic Helmet', 900, 0),
  ('Chaleco', 'GRS: AVS', 1600, 5),
  ('Chaleco', 'GRS: JPCR', 1200, 0),
  ('Chaleco', 'GRS: JJPC 2.0', 1300, 5),
  ('Chaleco', 'GRS: Plateframe', 1100, 0),
  ('Chaleco', 'GRS: Stranddhogg', 1500, 5),
  ('Chaleco', 'GRS: PC GEN III', 1400, 0),
  ('Chaleco', 'REC ARC V2 Plate Carrier', 1700, 0),
  ('Mochila', 'GRS: Spawn Radio', 1500, 0),
  ('Mochila', 'GRS: Tacticool Bag', 400, 0),
  ('Mochila', 'GRS: FILBE', 800, 5),
  ('Mochila', 'GRS: Trizip Bag', 600, 0),
  ('Mochila', 'GRS: Sling Bag', 350, 0),
  ('Mochila', 'GRS: Heraldry Sling Bag', 400, 0),
  ('Mochila', 'GRS MAAWS Pack', 1000, 0),
  ('Mochila', 'WP IIFS Large Combat Field Pack', 950, 0),
  ('Mochila', 'REC FILBE Backpack', 850, 0),
  ('Mochila', 'REC 6.22 Rush-12 Backpack', 550, 0),
  ('Pantalón', 'GRS: CRYE', 600, 5);

insert into public.accessories (category, name, price, stock, notes) values
  ('Mira', 'EXPS3', 350, 0, NULL),
  ('Mira', 'EXPS3 G33', 600, 0, NULL),
  ('Mira', 'SpecterDR 1-4x', 700, 5, NULL),
  ('Mira', '3.5-10 Scope', 650, 0, NULL),
  ('Mira', '4.5-14 Scope', 800, 0, NULL),
  ('Mira', 'Leupold VX-5HD 1-5X24', 750, 0, NULL),
  ('Mira', 'Leupold VX-5HD 2-10X42', 900, 0, NULL),
  ('Mira', 'Leupold VX-5HD 3-15X44', 1100, 0, NULL),
  ('Mira', 'Leupold VX-5HD 3-15X56', 1200, 0, NULL),
  ('Mira', 'Leupold VX-5HD 4-20X52', 1350, 0, NULL),
  ('Mira', 'S&B PM II x56', 1600, 0, NULL),
  ('Mira', 'S&B PM II x50', 1500, 0, NULL),
  ('Mira', 'Primary Arms SLX-1 x24', 600, 0, NULL),
  ('Mira', 'Vortex Razor HD Gen III x24', 1000, 0, NULL),
  ('Mira', 'Sig Sauer Tango 4 x24', 850, 0, NULL),
  ('Mira', 'NightForce ATACR x24', 1100, 0, NULL),
  ('Mira', 'EoTech Vudu x24', 950, 0, NULL),
  ('Mira', 'Dedal-NV DHF x24', 2200, 0, NULL),
  ('Mira', 'MKH XRAY x30 LPVO G2 CSRO', 1800, 0, NULL),
  ('Mira', 'Vortex Xm157 Rmr BLK', 2800, 0, NULL),
  ('Mira', 'Leupold HAMR 4X24', 1200, 5, NULL),
  ('Mira', 'Opticas especiales para M4 MAAWS', 1200, 0, NULL),
  ('Supresor', 'Supresores 5.56mm', 400, 5, NULL),
  ('Supresor', 'Supresores 6.5mm', 500, 0, NULL),
  ('Supresor', 'Supresores 7.62mm', 650, 5, NULL),
  ('Supresor', 'Supresor especial .308 Winchester', 850, 0, NULL),
  ('Modificaciones', 'Licencia para Modificar el armamento', 1500, 5, 'Habilita cambio de carcasa, grips, culata, bipode, ademas de agregar accesorios.');

insert into public.contract_bonus_types (label, amount, sort_order) values
  ('Infiltracion', 300, 1),
  ('Extraccion', 400, 2),
  ('Objetivo capturado', 700, 3),
  ('Sin bajas en el equipo', 500, 4),
  ('Recuperacion de Intel', 600, 5),
  ('Operacion nocturna', 350, 6),
  ('Supervivencia', 250, 7)
on conflict (label) do update set amount = excluded.amount, sort_order = excluded.sort_order;

insert into public.contract_risk_levels (level, percentage, sort_order) values
  (1, 0.03, 1),
  (2, 0.05, 2),
  (3, 0.15, 3),
  (4, 0.25, 4),
  (5, 0.5, 5)
on conflict (level) do update set percentage = excluded.percentage;

insert into public.sanction_types (severity, label, description, sort_order) values
  ('leve', 'Advertencia verbal', NULL, 1),
  ('leve', 'Amonestacion por comportamiento inapropiado', NULL, 2),
  ('leve', 'Incumplimiento menor de instrucciones', NULL, 3),
  ('leve', 'Comportamiento despectivo hacia otros miembros', NULL, 4),
  ('moderada', 'Sancion publica', NULL, 5),
  ('moderada', 'Incumplimiento de tareas asignadas', NULL, 6),
  ('moderada', 'Comportamiento disruptivo durante actividades grupales', NULL, 7),
  ('moderada', 'Falsificacion de reportes o datos en la comunidad', NULL, 8),
  ('grave', 'Suspension temporal (24-72 horas)', NULL, 9),
  ('grave', 'Amonestacion por falta de respeto a un superior', NULL, 10),
  ('grave', 'Faltas repetitivas a la cadena de mando', NULL, 11),
  ('grave', 'Actitudes agresivas o de acoso hacia otros miembros', NULL, 12),
  ('grave', 'Fugas de informacion confidencial o estrategica', NULL, 13),
  ('muy grave', 'Suspension prolongada (una semana o mas)', NULL, 14),
  ('muy grave', 'Fuego amigo intencional', NULL, 15),
  ('muy grave', 'Negarse a cumplir ordenes directas durante una mision', NULL, 16),
  ('muy grave', 'Sabotaje intencional a las actividades del equipo o misiones', NULL, 17),
  ('muy grave', 'Faltas graves de respeto o acoso reiterado', NULL, 18),
  ('extrema', 'Expulsion definitiva de la comunidad', NULL, 19),
  ('extrema', 'Fraude, hackeo o manipulacion de sistemas internos', NULL, 20),
  ('extrema', 'Traicion a los principios o valores de la comunidad', NULL, 21),
  ('extrema', 'Violaciones eticas graves (racismo, sexismo, etc.)', NULL, 22),
  ('extrema', 'Comportamiento extremadamente toxico o peligroso para otros', NULL, 23);


-- ============ CATALOGO DE HABILIDADES / MODULOS DE INSTRUCCION ============
insert into public.skills (name, category, description, sort_order) values
  ('Mod 1', 'Modulo', 'Modulo de instruccion basica 1.', 1),
  ('Mod 2', 'Modulo', 'Modulo de instruccion basica 2.', 2),
  ('Mod 3', 'Modulo', 'Modulo de instruccion basica 3.', 3),
  ('Mod 4', 'Modulo', 'Modulo de instruccion basica 4.', 4),
  ('Mod 5', 'Modulo', 'Modulo de instruccion avanzada 5.', 5),
  ('Mod 6', 'Modulo', 'Modulo de instruccion avanzada 6.', 6),
  ('Mod 7', 'Modulo', 'Modulo de instruccion avanzada 7.', 7),
  ('Mod 8', 'Modulo', 'Modulo de instruccion avanzada 8.', 8),
  ('Mod 9', 'Modulo', 'Modulo de especializacion 9.', 9),
  ('Mod 10', 'Modulo', 'Modulo de especializacion 10.', 10),
  ('Mod 11', 'Modulo', 'Modulo de especializacion 11.', 11),
  ('Curso Rol Especializado', 'Curso especializado', 'Certificacion de rol especializado dentro de una escuadra.', 12),
  ('Curso Lider de Equipo', 'Curso de liderazgo', 'Certificacion para dirigir una escuadra en operaciones.', 13),
  ('Curso Lider de Escuadra', 'Curso de liderazgo', 'Certificacion para supervisar multiples escuadras en operaciones.', 14)
on conflict (name) do update set category = excluded.category, description = excluded.description, sort_order = excluded.sort_order;
