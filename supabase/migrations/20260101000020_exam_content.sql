-- GOCS platform — exámenes difíciles originales, inspirados en el listado de
-- cursos de simulación militar de Legión Hispana (legionhispanamilsim.com),
-- adaptados a la doctrina y terminología de G.O.C.S. Cada examen queda ligado
-- a un módulo/curso existente en `skills` (o a uno nuevo, para JTAC) para que
-- aprobarlo genere automáticamente una evaluación en la hoja de vida del
-- operador y, gracias a la migración anterior, un bono único de créditos.

insert into public.skills (name, category, description, sort_order) values
  ('JTAC', 'Curso de especialista', 'Control terminal aéreo: CAS, MEDEVAC, marcación de LZ y Call For Fire.', 15);

insert into public.quizzes (skill_id, title, description, difficulty) values
  (
    (select id from public.skills where name = 'Mod 2'),
    'Examen: Fundamentos del Operador (Mod 2)',
    'Repliegues, saltos y principios de CQB. Basado en el temario de cursos de simulación militar de Legión Hispana, adaptado a la doctrina G.O.C.S.',
    'dificil'
  ),
  (
    (select id from public.skills where name = 'Mod 3'),
    'Examen: CQB Avanzado (Mod 3)',
    'Entradas dinámicas, fatal funnel y coordinación de equipo en espacios cerrados.',
    'dificil'
  ),
  (
    (select id from public.skills where name = 'Mod 8'),
    'Examen: Asalto y Defensa (Mod 8)',
    'Fuego y maniobra, posiciones defensivas y consolidación de objetivo.',
    'dificil'
  ),
  (
    (select id from public.skills where name = 'Mod 9'),
    'Examen: Interacción Civil (Mod 9)',
    'Checkpoints, escalada de fuerza, PID y trato con población no combatiente.',
    'dificil'
  ),
  (
    (select id from public.skills where name = 'Mod 11'),
    'Examen: Comunicaciones Avanzadas (Mod 11)',
    'Protocolo de radio, SALUTE, brevity codes y reportes de nueve líneas.',
    'dificil'
  ),
  (
    (select id from public.skills where name = 'JTAC'),
    'Examen: JTAC — CAS, MEDEVAC y Call For Fire',
    'Control terminal aéreo, danger close, tipos de control y marcación de objetivos.',
    'dificil'
  ),
  (
    (select id from public.skills where name = 'Curso Lider de Equipo'),
    'Examen: Jefe de Equipo',
    'Mando de equipo, briefing de misión, reacción inmediata y accountability.',
    'dificil'
  ),
  (
    (select id from public.skills where name = 'Curso Lider de Escuadra'),
    'Examen: Mando de Escuadra',
    'Sincronización multi-equipo, intención del comandante y análisis post-acción.',
    'dificil'
  );

-- Mod 2 — Fundamentos del Operador
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: Fundamentos del Operador (Mod 2)'), q, o::jsonb, c, s
from (values
  ('¿Cuál es la secuencia correcta de un repliegue por parejas (buddy bounding) bajo fuego?',
   '["Ambos operadores se mueven simultáneamente hacia la retaguardia","Un operador se repliega mientras el otro brinda fuego de cobertura, luego se invierten los roles","Todo el equipo se repliega en línea al mismo tiempo","El operador de retaguardia avanza primero"]', 1, 1),
  ('Al descender desde un helicóptero en una zona no despejada, ¿cuál es la prioridad antes de bajar?',
   '["Confirmar que el punto de aterrizaje está libre de amenazas y obstáculos","Lanzar una granada de humo para marcar posición","Descender lo más rápido posible sin importar el entorno","Esperar orden directa del piloto únicamente"]', 0, 2),
  ('En los principios fundamentales del CQB, ¿qué representa la ''dominancia del ángulo'' (angle dominance)?',
   '["Mantener siempre el arma apuntando al techo","Controlar el mayor ángulo de visión posible al entrar a una habitación antes de que el enemigo reaccione","Disparar siempre en un ángulo de 45°","Ceder el ángulo al segundo hombre del equipo"]', 1, 3),
  ('¿Cuál es el error más común de un operador novato al despejar una esquina (slicing the pie)?',
   '["Moverse demasiado lento","Exponer el cuerpo completo antes que el arma y la vista","Mantener distancia de la pared","Usar pasos cortos y controlados"]', 1, 4),
  ('Bajo fuego efectivo enemigo, ¿qué formación de repliegue es más apropiada para un equipo de 4 operadores?',
   '["Columna cerrada","Herradura estática","Bounding overwatch en pares, con cobertura mutua constante","Correr en dirección opuesta sin formación"]', 2, 5),
  ('¿Qué es el ''dead space'' en el despeje de una habitación?',
   '["El área fuera del alcance del arma","Las zonas que no pueden observarse desde el punto de entrada hasta avanzar más adentro","Un área ya despejada","El pasillo detrás del equipo"]', 1, 6),
  ('Al recibir la orden de repliegue sin tener línea de fuego clara, ¿qué transmite primero el operador?',
   '["Nada, simplemente se repliega","''Moviendo'' antes de iniciar el movimiento, para que el resto del equipo lo cubra","El nombre del enemigo","Espera a que todos se muevan primero"]', 1, 7),
  ('¿Cuál es el propósito de mantener ''muzzle awareness'' constante en espacios cerrados?',
   '["Es solo estético","Evitar apuntar el arma a compañeros mientras se mantiene cobertura sobre amenazas reales","Mantener el cañón siempre hacia abajo sin excepción","No tiene relación con la seguridad del equipo"]', 1, 8)
) as t(q, o, c, s);

-- Mod 3 — CQB Avanzado
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: CQB Avanzado (Mod 3)'), q, o::jsonb, c, s
from (values
  ('En una entrada dinámica contra una habitación con múltiples ocupantes, ¿cuál es el objetivo del point man?',
   '["Eliminar a todos los ocupantes él solo","Dominar el fatal funnel lo más rápido posible y salir de la línea de fuego de la puerta","Quedarse en la entrada como cobertura","Lanzar la granada y retirarse"]', 1, 1),
  ('¿Qué es el ''fatal funnel'' en CQB?',
   '["Un pasillo con trampas explosivas","El área de la puerta/entrada donde el operador está más expuesto y con menor cobertura","Una técnica de comunicación","El punto de reunión post-asalto"]', 1, 2),
  ('¿Cuándo se justifica una entrada de penetración limitada en lugar de un despeje completo?',
   '["Siempre, es más rápido","Cuando el equipo no tiene personal suficiente y se prioriza negar el acceso enemigo sin comprometerse totalmente","Nunca es válida","Solo de noche"]', 1, 3),
  ('¿Cuál es la función del hombre de seguridad trasera durante el movimiento dentro de una estructura?',
   '["Cubrir el frente junto al point man","Vigilar el área ya despejada y la retaguardia para evitar que el enemigo reingrese o flanquee","Cargar el equipo de demolición","No tiene función definida"]', 1, 4),
  ('En un asalto sincronizado a dos entradas simultáneas, ¿cuál es el riesgo principal si falla la sincronización?',
   '["Ninguno, cada equipo actúa independiente","Fuego cruzado entre equipos propios (fratricidio) al converger sin coordinación","Pérdida de munición","Ruido excesivo"]', 1, 5),
  ('¿Qué técnica minimiza la exposición al despejar una escalera?',
   '["Subir corriendo en grupo","Avanzar de a uno dominando ángulos progresivamente, con el resto cubriendo los ángulos ya expuestos","Lanzar una granada y subir después","Ignorar la escalera y buscar otra ruta siempre"]', 1, 6),
  ('¿Cuál es la diferencia entre las técnicas ''crossing'' y ''buttonhook'' al entrar por el lado del pomo?',
   '["No hay diferencia","En crossing el operador cruza al lado opuesto de la entrada; en buttonhook gira hacia el mismo lado por el que entró","Buttonhook solo se usa de noche","Crossing requiere más operadores"]', 1, 7),
  ('Al identificar un rehén y un hostil en el mismo campo visual durante un despeje dinámico, ¿cuál es la prioridad doctrinal?',
   '["Disparar a ambos igual","Identificación positiva de la amenaza antes de emplear fuego, priorizando la seguridad del no combatiente","Ignorar la situación y avanzar","Retirarse siempre sin evaluar"]', 1, 8)
) as t(q, o, c, s);

-- Mod 8 — Asalto y Defensa
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: Asalto y Defensa (Mod 8)'), q, o::jsonb, c, s
from (values
  ('En fuego y maniobra a nivel escuadra, ¿cuál es el propósito del elemento de apoyo (support by fire)?',
   '["Avanzar primero hacia el objetivo","Suprimir al enemigo con fuego efectivo para permitir que el elemento de asalto maniobre y cierre distancia","Retirarse mientras el otro elemento avanza","Coordinar solo la logística"]', 1, 1),
  ('¿Qué caracteriza una posición defensiva bien seleccionada?',
   '["Máxima visibilidad sin importar la cobertura","Campos de tiro despejados, cobertura/concealment y rutas de repliegue disponibles","Estar siempre en terreno bajo","Cercanía máxima al enemigo"]', 1, 2),
  ('¿Qué marca la transición de fuego de apoyo a fuego de asalto para evitar fratricidio en el asalto final?',
   '["Ninguna señal es necesaria","Un límite de fuego coordinado (phase line o señal predeterminada)","El silencio total del enemigo","El agotamiento de munición"]', 1, 3),
  ('¿Cuál es el objetivo de establecer un perímetro de 360° tras tomar un objetivo?',
   '["Facilitar el descanso del equipo","Prevenir un contraataque enemigo desde cualquier dirección mientras se consolida la posición","Es solo protocolo estético","Permitir el reagrupamiento sin vigilancia"]', 1, 4),
  ('¿Qué representa un ''punto de fuego final'' (final protective fire / FPF) en la defensa de una posición?',
   '["El último cartucho disponible","Una línea de fuego intensa predeterminada que se activa para detener un asalto enemigo inminente","Un tipo de granada","El área de descanso de la unidad"]', 1, 5),
  ('¿Por qué se escalonan (stagger) las posiciones en una línea defensiva en vez de alinearlas perfectamente?',
   '["Por estética","Para evitar que un solo proyectil o granada afecte a varios operadores y mejorar los campos de tiro cruzados","No tiene razón táctica","Para facilitar el conteo de personal"]', 1, 6),
  ('¿Qué información crítica aporta un reconocimiento de objetivo antes de comprometer fuerzas?',
   '["Solo el clima del día","Ubicación de obstáculos, posiciones enemigas probables, rutas de aproximación y vías de escape","El color del uniforme enemigo","Nada relevante, es opcional"]', 1, 7),
  ('¿Cuál es el propósito táctico de una posición de reserva en una operación de asalto?',
   '["Descansar mientras los demás pelean","Explotar el éxito, reforzar un punto débil o cubrir un repliegue imprevisto según evolucione la situación","Cargar el equipo pesado únicamente","No tiene función táctica real"]', 1, 8)
) as t(q, o, c, s);

-- Mod 9 — Interacción Civil
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: Interacción Civil (Mod 9)'), q, o::jsonb, c, s
from (values
  ('Al establecer un checkpoint en zona con población civil, ¿cuál es el primer paso antes de detener vehículos?',
   '["Abrir fuego de advertencia","Señalización clara y visible con antelación suficiente para que los civiles reaccionen de forma segura","Bloquear la vía sin ningún aviso","Detener solo vehículos militares"]', 1, 1),
  ('¿Qué principio rige la escalada de fuerza ante un civil no cooperativo en un checkpoint?',
   '["Uso inmediato de fuerza letal","Progresión gradual: señales visuales/verbales, luego físicas, y fuerza letal solo como último recurso ante amenaza real","Ignorar la situación","Detener a todos los civiles sin excepción"]', 1, 2),
  ('En una reunión con líderes locales (key leader engagement), ¿cuál es el objetivo estratégico principal?',
   '["Obtener inteligencia únicamente por la fuerza","Construir relaciones de confianza que faciliten cooperación, inteligencia y estabilidad en la zona","Ignorar a la población local","Imponer reglas sin negociación"]', 1, 3),
  ('¿Qué es PID (Identificación Positiva) y por qué es crítico en zonas con presencia civil?',
   '["Un tipo de radio","La confirmación inequívoca de que un objetivo es una amenaza legítima antes de emplear fuerza, para evitar bajas civiles","Un documento de identidad militar","Un procedimiento de evacuación médica"]', 1, 4),
  ('¿Cómo debe manejarse el hallazgo de un civil herido durante una operación activa?',
   '["Ignorarlo y continuar sin reportar","Reportarlo por la cadena de mando, brindar primeros auxilios si la situación táctica lo permite y coordinar evacuación","Detenerlo como sospechoso automáticamente","Dejarlo sin evaluar la situación"]', 1, 5),
  ('¿Qué factor debe priorizarse al elegir rutas de patrulla en zona urbana para minimizar riesgo a no combatientes?',
   '["La ruta más corta sin importar el entorno","Evitar zonas de alta densidad civil cuando sea posible, y ajustar el nivel de alerta cuando no lo sea","Siempre atravesar el centro poblado","No es un factor relevante"]', 1, 6),
  ('¿Qué documenta un reporte de daño colateral tras una operación con contacto en zona poblada?',
   '["Solo el gasto de munición","El impacto sobre civiles, infraestructura y propiedad no militar, para revisión y rendición de cuentas","La moral del equipo","Nada, no se documenta"]', 1, 7),
  ('¿Por qué es importante mantener consistencia en el trato hacia la población civil a lo largo de una campaña?',
   '["No es importante","Genera confianza y reduce la percepción de arbitrariedad, mejorando cooperación y seguridad propia a largo plazo","Solo importa para la propaganda","Ralentiza las operaciones sin beneficio"]', 1, 8)
) as t(q, o, c, s);

-- Mod 11 — Comunicaciones Avanzadas
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: Comunicaciones Avanzadas (Mod 11)'), q, o::jsonb, c, s
from (values
  ('En un reporte SALUTE (Size, Activity, Location, Unit, Time, Equipment), ¿qué corresponde a la ''A''?',
   '["El armamento visible","La actividad que está realizando el elemento observado","El tamaño de la unidad","La hora del avistamiento"]', 1, 1),
  ('¿Cuál es el propósito de usar el alfabeto fonético (Alpha, Bravo, Charlie...) en comunicaciones radiales?',
   '["Sonar más profesional","Reducir ambigüedad y errores de comprensión de letras individuales con mala señal o ruido","Es solo tradición sin propósito funcional","Ahorrar tiempo de transmisión"]', 1, 2),
  ('¿Qué significa transmitir ''contacto, wait out'' en el protocolo de radio táctico?',
   '["Fin de la transmisión definitiva","Se estableció contacto con el enemigo y se solicita mantener el canal libre porque se enviará información crítica en breve","Solicitud de refuerzos inmediatos","Cancelación de la misión"]', 1, 3),
  ('En un reporte de nueve líneas para evacuación médica (MEDEVAC), ¿qué indica la línea 3?',
   '["Frecuencia de contacto","Número de pacientes por precedencia (urgente, prioritario, rutinario)","Equipo especial requerido","Método de marcación de la zona de aterrizaje"]', 1, 4),
  ('¿Qué se espera como respuesta a un ''radio check'' o ''commo check''?',
   '["Una confirmación de la calidad de la señal (ej. ''lima charlie'' / ''alto y claro'')","Solo se usa en emergencias, sin respuesta esperada","Silencio absoluto como respuesta","Coordenadas GPS obligatorias"]', 0, 5),
  ('¿Por qué se usan ''brevity codes'' (códigos breves) en comunicaciones bajo contacto?',
   '["Para confundir al enemigo únicamente","Para transmitir información crítica de forma rápida y clara, minimizando el tiempo en el aire y el riesgo de intercepción","No tiene relación con la seguridad","Es un requisito estético del protocolo"]', 1, 6),
  ('Durante una emergencia por bajas (CASEVAC), ¿qué prioridad tiene transmitir la ubicación exacta?',
   '["Es irrelevante si hay bajas","Es una de las prioridades más altas, ya que determina la respuesta y el tiempo de rescate","Se transmite únicamente al finalizar la operación","Se transmite solo por escrito post-misión"]', 1, 7),
  ('¿Qué información debe evitarse transmitir en claro si el enemigo puede interceptar la radio?',
   '["El clima","Ubicaciones exactas propias, planes futuros e identidades de personal clave sin necesidad operativa","Confirmaciones de recepción","Nada debe evitarse"]', 1, 8)
) as t(q, o, c, s);

-- JTAC — CAS, MEDEVAC y Call For Fire
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: JTAC — CAS, MEDEVAC y Call For Fire'), q, o::jsonb, c, s
from (values
  ('En una solicitud de apoyo aéreo cercano (CAS) mediante un reporte de nueve líneas, ¿qué indica la línea 6?',
   '["El tipo de marcación del objetivo","La ubicación exacta del objetivo (coordenadas)","La frecuencia de la aeronave","La dirección de egreso"]', 1, 1),
  ('¿Qué significa ''danger close'' en una solicitud de fuego de apoyo (Call For Fire)?',
   '["Que el objetivo está fuera de rango","Que el objetivo está lo bastante cerca de fuerzas propias como para requerir autorización especial y ajustes de precisión","Que se cancela la misión de fuego","Que solo se puede usar humo"]', 1, 2),
  ('En el control terminal de una aeronave de apoyo, ¿qué caracteriza específicamente al ''Type 1 control''?',
   '["El JTAC no necesita ver el objetivo ni la aeronave","El JTAC requiere contacto visual directo del objetivo y de la aeronave/munición antes de autorizar el ataque","Es exclusivo para ataques nocturnos","No requiere autorización del JTAC"]', 1, 3),
  ('¿Qué propósito tiene la ''ronda de ajuste'' (adjust fire) antes de la misión de fuego para efecto en un Call For Fire?',
   '["Gastar munición de forma controlada","Verificar y corregir la precisión del impacto respecto al objetivo real antes del fuego de efecto masivo","Señalar el fin de la misión","Confirmar la identidad del observador"]', 1, 4),
  ('¿Qué información se transmite en la línea 8 de un 9-line MEDEVAC?',
   '["Frecuencia de contacto","Nacionalidad y estatus del paciente (militar propio, enemigo, civil)","Número de pacientes","Equipo especial requerido"]', 1, 5),
  ('¿Cuál es la responsabilidad principal de un JTAC durante toda la ejecución de una misión de CAS?',
   '["Pilotar la aeronave de forma remota","Controlar y autorizar el empleo de armamento aéreo garantizando la identificación positiva del objetivo y la seguridad de fuerzas propias","Coordinar únicamente la logística de combustible","Reemplazar al comandante de la unidad"]', 1, 6),
  ('Al marcar un objetivo con humo o láser para CAS, ¿por qué es crítico confirmar la marca con la aeronave antes de autorizar el ataque?',
   '["No es necesario, la aeronave siempre confirma sola","Para evitar que ataque una marca equivocada o una posición amiga por confusión de referencia","Solo es un protocolo estético","El humo nunca se usa para marcación real"]', 1, 7),
  ('¿Qué línea del 9-line CAS indica específicamente la ubicación de las fuerzas amigas respecto al objetivo?',
   '["Línea 4","Línea 8","Línea 2","Línea 9"]', 1, 8)
) as t(q, o, c, s);

-- Jefe de Equipo
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: Jefe de Equipo'), q, o::jsonb, c, s
from (values
  ('¿Cuál es la responsabilidad principal de un Jefe de Equipo durante la ejecución de una misión?',
   '["Ejecutar personalmente todas las tareas del equipo","Coordinar y dirigir a los miembros del equipo, tomar decisiones tácticas inmediatas y mantener el enlace con el mando superior","Solo cargar el equipo de comunicaciones","Reemplazar al líder de escuadra en todo momento"]', 1, 1),
  ('Al recibir una orden de operación (OPORD) de su superior, ¿qué debe hacer el Jefe de Equipo antes de ejecutar la misión?',
   '["Ejecutar inmediatamente sin briefing","Dar un briefing claro a su equipo cubriendo situación, misión, ejecución, logística y mando/comunicaciones","Delegar el briefing a un subordinado sin revisión","Esperar a estar en el objetivo para explicar la misión"]', 1, 2),
  ('Durante contacto con el enemigo, ¿cuál es la secuencia de reacción inmediata que debe liderar el Jefe de Equipo?',
   '["Retirada inmediata sin evaluación","Identificar la amenaza, tomar cobertura, retornar fuego efectivo y luego maniobrar según la situación","Esperar órdenes del Estado Mayor antes de reaccionar","Ignorar el contacto y continuar la ruta original"]', 1, 3),
  ('¿Qué sugiere el principio de ''span of control'' sobre el número óptimo de subordinados que un Jefe de Equipo puede supervisar eficazmente en combate?',
   '["Ilimitado, no hay un límite práctico","Generalmente entre 3 y 5 subordinados directos, para mantener control efectivo bajo estrés","Exactamente 10","Solo 1"]', 1, 4),
  ('¿Cómo debe un Jefe de Equipo gestionar a un operador que repetidamente no sigue procedimientos de seguridad con el arma?',
   '["Ignorarlo si es un buen tirador","Corregirlo de inmediato, documentar el problema y escalarlo al mando si persiste","Expulsarlo sin advertencia previa","No es su responsabilidad"]', 1, 5),
  ('Al reportar ''misión cumplida'' tras el repliegue del equipo, ¿qué debe verificar primero el Jefe de Equipo?',
   '["Solo que el objetivo fue destruido","Conteo de personal (accountability), estado de heridos y que todo el equipo esté fuera de la zona de peligro","Que el enemigo se haya rendido","Nada, el reporte es automático"]', 1, 6),
  ('¿Cuál es el rol del Jefe de Equipo al designar un punto de reunión (rally point) antes de una infiltración?',
   '["No es necesario designarlo","Seleccionar un lugar identificable y defendible donde el equipo pueda reagruparse si se dispersa o pierde contacto","Es responsabilidad exclusiva del piloto de transporte","Se designa solo después de la misión"]', 1, 7),
  ('¿Qué distingue a un buen Jefe de Equipo en la toma de decisiones bajo presión de tiempo limitado?',
   '["Esperar siempre confirmación explícita de cada detalle antes de actuar","Aplicar juicio táctico basado en la intención del mando superior para actuar decisivamente con información incompleta","Delegar toda decisión a votación del equipo","No actuar hasta tener el 100% de la información"]', 1, 8)
) as t(q, o, c, s);

-- Mando de Escuadra
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: Mando de Escuadra'), q, o::jsonb, c, s
from (values
  ('¿Cuál es la diferencia principal en el alcance de responsabilidad entre un Jefe de Equipo y un Líder de Escuadra?',
   '["No hay diferencia real","El Líder de Escuadra coordina múltiples equipos y mantiene la visión general de la operación, mientras el Jefe de Equipo se enfoca en su propio equipo","El Jefe de Equipo tiene más autoridad","El Líder de Escuadra no tiene contacto con el Estado Mayor"]', 1, 1),
  ('Al planificar una operación con múltiples equipos, ¿qué usa el Líder de Escuadra para sincronizar las acciones de cada elemento en tiempo y espacio?',
   '["Ninguna herramienta, cada equipo actúa independiente","Una matriz de sincronización o plan de fases (phase lines, timeline)","Solo comunicación verbal improvisada","El azar"]', 1, 2),
  ('Si un equipo reporta bajas y pérdida de capacidad de combate durante la operación, ¿qué debe evaluar el Líder de Escuadra?',
   '["Ignorar el reporte y continuar el plan original","Reevaluar la misión: reforzar con la reserva, reasignar tareas, o abortar/replanificar según la situación","Ordenar al equipo herido que se retire completamente sin evaluación","Esperar el fin de la operación para reaccionar"]', 1, 3),
  ('¿Qué representa la ''intención del comandante'' (commander''s intent) y por qué es crítica para el Líder de Escuadra?',
   '["Es un detalle opcional sin importancia práctica","El propósito final que debe lograrse, permitiendo a los subordinados adaptar sus acciones si el plan original falla","Es solo el nombre en clave de la operación","Se aplica solo al nivel más alto de mando"]', 1, 4),
  ('Cuando dos equipos bajo el mismo Líder de Escuadra operan en proximidad de fuego, ¿qué coordinación es esencial?',
   '["Ninguna, si ambos son aliados","Establecer límites de sector de fuego claros para prevenir fratricidio","Confiar en el reconocimiento visual sin protocolo","Combinar ambos equipos en uno solo siempre"]', 1, 5),
  ('Ante inteligencia contradictoria justo antes de ejecutar una operación, ¿cuál es la responsabilidad del Líder de Escuadra?',
   '["Ejecutar el plan original sin cuestionarlo","Evaluar el riesgo, verificar la información si el tiempo lo permite, y ajustar el plan o escalar la decisión","Cancelar automáticamente toda operación ante cualquier duda","Delegar la decisión a un subordinado sin contexto"]', 1, 6),
  ('¿Cómo debe el Líder de Escuadra gestionar la fatiga de varios equipos durante una operación prolongada?',
   '["No es relevante para el planeamiento","Rotar equipos entre tareas de mayor y menor exigencia, y planificar puntos de descanso cuando la misión lo permita","Mantener a todos en máxima exigencia constante","Es responsabilidad exclusiva de cada operador individual"]', 1, 7),
  ('¿Qué se espera que haga un Líder de Escuadra tras finalizar una operación, para la mejora continua de la unidad?',
   '["Nada, la operación termina al cumplir el objetivo","Conducir un análisis post-acción (AAR) identificando qué funcionó, qué falló y qué se ajustará a futuro","Solo reportar bajas sin más análisis","Delegar el análisis a un tercero sin participar"]', 1, 8)
) as t(q, o, c, s);
