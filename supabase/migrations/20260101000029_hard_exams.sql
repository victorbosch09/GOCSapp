-- GOCS platform — cuatro exámenes nuevos, deliberadamente mucho más
-- exigentes que los de la migración 20260101000020: 25 preguntas cada uno,
-- con razonamiento numérico/lógico (balística, navegación) o análisis de
-- escenario en vez de trivia de definición. La posición Y la extensión de
-- la respuesta correcta se balanceó a mano entre las 4 opciones en cada
-- pregunta — cada distractor es una afirmación táctica igual de específica
-- y de longitud comparable a la correcta, no un descarte corto, evitando el
-- patrón de "la opción más larga siempre es la correcta". Verificado con un
-- script: la correcta es la más larga en <15% de las 100 preguntas.
-- Bono de aprobación más alto (2000cr) que el resto del catálogo, acorde a
-- la dificultad.

insert into public.skills (name, category, description, sort_order) values
  ('Navegación y Tiro de Precisión', 'Curso de especialista', 'Azimuts, pace count, resección, balística de precisión (MOA/mil, viento, Coriolis).', 16),
  ('MOUT Avanzado', 'Curso de especialista', 'Combate en estructuras: breaching, subterráneo, rooftop, colapso estructural, stacks.', 17),
  ('Inteligencia Táctica y ROE', 'Curso de especialista', 'PID, escalada de fuerza, patrón de vida, ciclo de inteligencia, proporcionalidad.', 18),
  ('Logística y COMSEC', 'Curso de especialista', 'Seguridad de comunicaciones, triage, prioridad de reabastecimiento, brevity codes.', 19);

insert into public.quizzes (skill_id, title, description, difficulty, bonus_amount) values
  (
    (select id from public.skills where name = 'Navegación y Tiro de Precisión'),
    'Examen: Navegación Táctica y Balística de Precisión',
    'Cálculo de azimuts, pace count, resección, MOA/mils, viento y Coriolis. Requiere hacer cuentas, no solo memoria.',
    'dificil',
    2000
  ),
  (
    (select id from public.skills where name = 'MOUT Avanzado'),
    'Examen: MOUT Avanzado y Combate en Estructuras',
    'Breaching, subterráneo, rooftop, colapso estructural, stacks y fatal funnels. Escenarios, no definiciones sueltas.',
    'dificil',
    2000
  ),
  (
    (select id from public.skills where name = 'Inteligencia Táctica y ROE'),
    'Examen: Inteligencia Táctica, PID y Reglas de Enfrentamiento',
    'Identificación positiva, escalada de fuerza, patrón de vida, ciclo de inteligencia y proporcionalidad.',
    'dificil',
    2000
  ),
  (
    (select id from public.skills where name = 'Logística y COMSEC'),
    'Examen: Logística de Combate y Seguridad de Comunicaciones',
    'COMSEC, triage START, prioridad de reabastecimiento bajo contacto, brevity codes y clases de abastecimiento.',
    'dificil',
    2000
  );

-- ============================================================
-- Examen 1 — Navegación Táctica y Balística de Precisión
-- ============================================================
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: Navegación Táctica y Balística de Precisión'), q, o::jsonb, c, s
from (values
  ('Un operador camina un azimut de 160° hacia un punto. Para el regreso sin usar la brújula de nuevo, ¿qué cálculo de azimut inverso aplica?',
   '["Sumar 180° al azimut original, obteniendo un rumbo de regreso de 340°","Restar 180° del azimut original, lo que da un valor negativo sin sentido práctico","Sumar 90° al azimut original, para obtener un nuevo rumbo de 250°","Usar siempre un valor fijo de 180° sin considerar el azimut original de ida"]', 0, 1),
  ('Con un pace count personal de 62 pasos dobles por cada 100 metros, ¿cuántos pasos dobles debe contar el operador en un tramo nocturno de 500 metros?',
   '["Unos 350 pasos dobles, redondeando el conteo hacia arriba por el terreno irregular","310 pasos dobles, siguiendo la proporción exacta de su pace count personal","620 pasos dobles, duplicando el valor base de referencia por metro","500 pasos dobles, igualando la cifra a la distancia real en metros"]', 1, 2),
  ('En un mapa militar con escala 1:50.000, una distancia medida de 4 centímetros representa en el terreno real:',
   '["Unos 200 metros, tomando la escala como un factor de conversión directa","Unos 20 kilómetros, multiplicando el valor medido por mil directamente","2 kilómetros exactos, aplicando la proporción completa de la escala","Unos 500 metros, redondeando la cifra a un valor operativo práctico"]', 2, 3),
  ('Un tirador calcula una caída de bala de 4 MOA a 400 metros, sabiendo que 1 MOA equivale a unos 2,9 cm cada 100 metros. ¿Qué ajuste en centímetros corresponde aplicar?',
   '["Unos 12 centímetros, calculando el valor de un solo MOA sin escalar","Unos 116 centímetros, multiplicando el valor por diez en vez de por cuatro","Apenas 4 centímetros, igualando el ajuste al número de MOA sin más","Unos 46 centímetros, escalando correctamente el valor por MOA y distancia"]', 3, 4),
  ('Con un viento de 10 km/h a 300 metros, ¿cómo se compara el ajuste de deriva necesario a valor completo (perpendicular) frente a valor medio (en diagonal)?',
   '["Es idéntico en ambos casos, porque el ángulo del viento no afecta la deriva","El ajuste a valor medio es menor que el requerido a valor completo","El ajuste a valor medio resulta mayor que el de valor completo","A valor medio no corresponde aplicar ningún ajuste de deriva"]', 1, 5),
  ('Al triangular con brújula desde dos puntos conocidos hacia un punto desconocido, ¿qué factor introduce mayor error en la posición estimada final?',
   '["Usar solamente dos puntos de observación en vez de un tercero adicional","Marcar los azimuts resultantes sobre un mapa de escala grande","Tomar los azimuts desde puntos muy cercanos entre sí, con ángulo agudo","Tomar la lectura de brújula estando de pie en vez de sentado en el suelo"]', 2, 6),
  ('Un equipo debe cruzar 200 metros de zona abierta bajo posible observación enemiga, de noche y con NVG limitados. ¿Qué técnica de movimiento es más apropiada?',
   '["Cruzar en línea recta a la carrera, todos juntos, para exponerse menos tiempo","Cruzar en columna cerrada para mantener control visual constante del grupo","Esperar el amanecer, confiando en la visibilidad natural del terreno","Cruzar escalonado en pares, con intervalos de distancia y tiempo entre sí"]', 3, 7),
  ('La "regla del pulgar" para estimar distancia con los dedos y un objeto de tamaño conocido se basa principalmente en:',
   '["La relación entre el ancho angular del dedo y el tamaño real del objetivo","La diferencia entre la velocidad del sonido y la de la luz percibida por el observador","El tiempo que tarda un objeto en cruzar completo el campo visual","La cantidad de dedos necesarios para cubrir el horizonte visible"]', 0, 8),
  ('Recorriendo el mismo trayecto de día y de noche, el pace count contado de noche generalmente resulta:',
   '["Idéntico, porque la distancia real recorrida no cambia entre día y noche","Menor, porque el operador tiende a caminar más rápido por precaución","Mayor, porque el paso se acorta por terreno difícil de ver y obstáculos","Imposible de estimar sin apoyo de un dispositivo GPS en cualquier caso"]', 2, 9),
  ('Al aplicar "resección" con dos características de terreno identificables para ubicar la propia posición, el procedimiento correcto es:',
   '["Sumar las distancias estimadas a cada característica de terreno visible","Consultar la posición exacta por radio a un equipo cercano en la zona","Usar una sola característica visible y estimar por tiempo de marcha","Trazar el azimut inverso hacia cada punto conocido y cruzar las líneas"]', 3, 10),
  ('Un mil (miliradián) usado en óptica de precisión equivale aproximadamente a:',
   '["1 metro de ancho a 1000 metros de distancia desde el observador","1 centímetro de ancho a 100 metros de distancia desde el observador","Exactamente lo mismo que un MOA, son unidades intercambiables","10 centímetros de ancho a solo 1 metro de distancia del observador"]', 0, 11),
  ('Si un objetivo de 1,8 m de altura subtiende 2 mils en la retícula (distancia = altura x 1000 / mils), ¿a qué distancia aproximada se encuentra?',
   '["Unos 360 metros, dividiendo la altura por el doble de los mils medidos","900 metros, aplicando correctamente la fórmula de altura y mils","Unos 1800 metros, multiplicando la altura por mil sin dividir después","Unos 450 metros, tomando solo un cuarto del resultado de la fórmula"]', 1, 12),
  ('La declinación magnética debe considerarse al navegar porque:',
   '["Las brújulas convencionales dejan de funcionar cerca de la línea ecuatorial","Afecta exclusivamente a la navegación satelital, nunca a la brújula física","Modifica la distancia real medida entre dos puntos marcados en el mapa","El norte magnético y el de cuadrícula del mapa no coinciden exactamente"]', 3, 13),
  ('Un equipo pierde la cuenta exacta de su posición de noche tras cruzar terreno difícil. ¿Cuál es el procedimiento más seguro antes de continuar?',
   '["Detenerse, hacer un alto de seguridad y reorientarse con el terreno antes de seguir","Seguir avanzando en la dirección estimada y corregir recién al amanecer del día siguiente","Solicitar extracción inmediata por radio ante la pérdida de referencia","Dividir el equipo en dos grupos para cubrir más área de búsqueda"]', 0, 14),
  ('En un tiro a larga distancia, el efecto Coriolis se vuelve tácticamente relevante principalmente:',
   '["En cualquier disparo realizado, sin importar en absoluto la distancia real hacia el objetivo que se haya elegido","En distancias largas, donde el mayor tiempo de vuelo permite que la rotación terrestre desvíe el impacto","Solo en distancias cortas, generalmente por debajo de los 100 metros","Únicamente cuando el tirador se encuentra en el hemisferio norte"]', 1, 15),
  ('Para mantener una línea de marcha recta sin brújula durante el día, la técnica más confiable es:',
   '["Caminar manteniendo siempre al sol en la misma posición relativa fija","Contar los pasos dados y girar el rumbo cada cien pasos completados","Alinear dos puntos de referencia distantes y avanzar de uno al otro","Seguir siempre el curso visible de un río cercano hasta el objetivo"]', 2, 16),
  ('¿Por qué un tirador ajusta el "zero" de su óptica a una distancia específica y no a la distancia máxima teórica del arma?',
   '["Para que la trayectoria sea óptima dentro del rango de combate más probable","Porque los fabricantes de óptica lo exigen como norma de fábrica","Porque a mayor distancia el punto cero pierde precisión de forma permanente e irreversible","Porque el zero no depende realmente de la distancia elegida"]', 0, 17),
  ('Durante la planificación de ruta, un "handrail" táctico se define como:',
   '["El límite administrativo que marca dónde termina oficialmente la zona de operaciones asignada","Un tipo de agarre específico usado para escalar obstáculos verticales","Una estructura física usada como referencia lineal para navegar sin exponerse a ella","La distancia mínima de seguridad permitida entre dos operadores"]', 2, 18),
  ('Si el viento cambia de dirección durante una serie de disparos de precisión, la acción correcta del tirador es:',
   '["Ignorar el cambio de viento si ya se hizo un ajuste al inicio de la serie de disparos","Recalcular la deriva con la nueva lectura antes de cada disparo siguiente","Duplicar automáticamente el ajuste anterior por precaución adicional","Cambiar de posición de tiro de inmediato ante cualquier cambio de viento"]', 1, 19),
  ('Un pace count cuenta "pasos dobles" en vez de pasos simples principalmente porque:',
   '["Es solo una convención heredada de otros ejércitos, sin ninguna razón práctica real","Reduce el número final del conteo, facilitando la cuenta mental en marchas largas","Los pasos simples no pueden contarse con precisión suficiente","Esta convención solo aplica en terrenos completamente planos"]', 1, 20),
  ('Al recibir aviso de un "Área de Fuego Restringida" (RFA) en la zona de operación, esto significa que:',
   '["Se permite el fuego solo bajo condiciones o autorizaciones definidas por el mando","Está completamente prohibido disparar en esa área bajo cualquier circunstancia posible","Es una zona reservada de forma exclusiva para el uso de artillería propia","La restricción aplica solo a vehículos blindados, no a infantería"]', 0, 21),
  ('Observar el pasto y las hojas sueltas con leves ondulaciones visibles generalmente indica un viento de:',
   '["Apenas 0 a 3 km/h, un viento casi imperceptible en el terreno","Entre 25 y 30 km/h, ya un viento considerado bastante moderado a fuerte","Más de 40 km/h, correspondiente a un viento ya bastante fuerte","Entre 5 y 10 km/h, suficiente para mover objetos livianos y hojas"]', 3, 22),
  ('Con el "método de reloj", si el observador dice "objetivo a las 3, 200 metros", el tirador debe orientarse:',
   '["Hacia el norte absoluto del mapa, sin importar hacia dónde mira ahora","90° a la izquierda de la dirección en la que está orientado actualmente","90° a la derecha de la dirección en la que está orientado actualmente","Directamente hacia atrás, en dirección opuesta a su orientación actual"]', 2, 23),
  ('Durante una infiltración a pie con waypoints, ¿por qué se recomienda no trazar una línea recta perfecta entre dos puntos en terreno hostil?',
   '["Porque facilita que el enemigo prediga la ruta y prepare una emboscada directa","Porque una línea recta perfecta demanda más tiempo de marcha que una ruta curva equivalente","Porque las brújulas pierden precisión en trayectos largos y rectos","No existe ninguna razón táctica real, es solo preferencia personal"]', 0, 24),
  ('Un operador mide 800 mils entre dos objetos con binoculares graduados, sabiendo que 6400 mils equivalen a 360°. ¿A cuántos grados equivale esa medición?',
   '["Unos 30°, redondeando el resultado hacia el valor más bajo posible","Unos 60°, tomando el doble del resultado correcto de la conversión","Unos 90°, asumiendo una proporción de un cuarto de vuelta completa","45°, aplicando correctamente la proporción entre mils y grados"]', 3, 25)
) as t(q, o, c, s);

-- ============================================================
-- Examen 2 — MOUT Avanzado y Combate en Estructuras
-- ============================================================
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: MOUT Avanzado y Combate en Estructuras'), q, o::jsonb, c, s
from (values
  ('En el método de "stacking" antes de entrar a una habitación, ¿quién determina el momento y la señal de entrada del equipo?',
   '["El primer hombre de la fila, actuando por su cuenta sin coordinación","El líder o el último hombre, confirmando \"listo\" antes de dar la señal","Un conteo fijo de tres segundos que todos siguen sin confirmación previa","El operador más cercano a la puerta, simplemente por su posición física"]', 1, 1),
  ('La diferencia principal entre una brecha mecánica y una brecha explosiva en MOUT es que:',
   '["La brecha mecánica resulta siempre más rápida que la explosiva en absolutamente todos los casos posibles","La brecha explosiva no exige retirarse a ninguna distancia de seguridad","La mecánica usa herramientas y depende de tiempo y fuerza; la explosiva usa carga controlada","Ambos términos son intercambiables sin ninguna diferencia táctica real"]', 2, 2),
  ('El mayor riesgo táctico de operar en ambientes subterráneos frente a un edificio convencional es:',
   '["Una temperatura más alta que afecta notablemente el rendimiento físico","Que no se puede usar armamento largo por el espacio reducido generalmente disponible","Que la navegación resulta más simple al haber un solo camino posible","Fugas limitadas, eco que distorsiona el sonido y ventaja previa del enemigo"]', 3, 3),
  ('Grietas diagonales recientes en las paredes de un edificio bombardeado son indicador de:',
   '["Posible inestabilidad estructural y riesgo de colapso ante carga adicional","Que el edificio es simplemente más antiguo de lo normal, sin ningún riesgo estructural real","Actividad enemiga reciente específicamente dentro de esa estructura","Un detalle puramente estético sin ninguna relevancia táctica"]', 0, 4),
  ('Al despejar un techo en un entorno urbano denso, la mayor amenaza suele provenir de:',
   '["El propio techo, por resultar estructuralmente inestable en la mayoría de los casos","Aeronaves enemigas dedicadas exclusivamente a labores de reconocimiento","Techos adyacentes de edificios más altos con línea de visión hacia la posición","La imposibilidad práctica de usar la radio estando en altura"]', 2, 5),
  ('Las escaleras se consideran una de las zonas más peligrosas de un edificio porque:',
   '["Suelen estar minadas de forma sistemática en cualquier zona de conflicto activo","No permiten el uso de armas largas dentro de ese espacio reducido","Resultan demasiado estrechas para que dos operadores se muevan en pares","Combinan un fatal funnel vertical con ángulos de fuego y cobertura limitados"]', 3, 6),
  ('Un pasillo largo y estrecho representa un "fatal funnel" porque:',
   '["Canaliza el movimiento del equipo y lo expone a fuego sostenido sin dispersión","Es el único punto de la estructura donde efectivamente se permite usar granadas de mano","Reduce de forma automática la cadencia de disparo del armamento","Esta condición aplica únicamente a edificios de más de tres pisos"]', 0, 7),
  ('Entrar a una habitación por una ventana en vez de una puerta suele considerarse más riesgoso porque:',
   '["Las ventanas están siempre más vigiladas que las puertas en cualquier tipo de edificio","El operador pierde estabilidad y velocidad durante la transición, quedando expuesto","Está prohibido por las reglas de enfrentamiento estándar en toda operación","El vidrio hace ruido y alerta automáticamente al enemigo en todos los casos"]', 1, 8),
  ('La técnica de "penetración limitada" al despejar una habitación consiste en:',
   '["Entrar por completo y ocupar cada rincón del espacio antes de continuar","No entrar en absoluto, despejando el espacio completo solo desde el marco de la puerta","Usar exclusivamente granadas de fragmentación antes de cualquier entrada","Entrar lo suficiente para dominar los ángulos clave sin recorrer todo el espacio"]', 3, 9),
  ('El propósito táctico de "mouse-holing" (abrir un boquete entre paredes en vez de usar puertas) es:',
   '["Moverse entre habitaciones evitando puntos de entrada esperados, reduciendo exposición","Ahorrar munición al no tener que despejar formalmente cada puerta","Crear ventilación adicional dentro de la estructura durante toda la operación militar en curso","Es una técnica pensada exclusivamente para vehículos blindados urbanos"]', 0, 10),
  ('Operar dentro del alcantarillado urbano añade el riesgo específico de:',
   '["Una exposición aérea constante durante todo el desplazamiento subterráneo","Acumulación de gases y falta de vías de escape rápidas ante un contacto","Contar con mayor visibilidad general que la disponible en superficie","Una imposibilidad total de comunicación por radio en cualquier circunstancia"]', 1, 11),
  ('Al despejar un edificio de varios pisos, la doctrina general recomienda:',
   '["Empezar siempre por el sótano del edificio, sin excepción alguna","Despejar todos los pisos de forma simultánea con equipos totalmente sin coordinar entre sí","Despejar de arriba hacia abajo cuando sea posible, forzando al enemigo hacia abajo","Ignorar los pisos superiores si el objetivo ya fue confirmado en planta baja"]', 2, 12),
  ('Cruzar un patio o plaza abierta rodeada de edificios altos requiere principalmente:',
   '["Minimizar el tiempo de exposición usando cobertura de humo o apoyo elevado propio","Cruzar siempre en fila india estricta para mantener el orden del equipo","Evitar por completo cualquier cruce de este tipo, sin excepción alguna en la misión","Realizarlo únicamente de noche, sin importar el objetivo de la misión"]', 0, 13),
  ('Un cable tendido a baja altura cerca de una entrada, fuera de lugar respecto al entorno, debe interpretarse como:',
   '["Un cable eléctrico normal del entorno urbano, sin relevancia táctica","Posible indicador de trampa explosiva; debe evitarse el contacto y reportarse","Una señal amiga que confirma que la zona ya fue despejada antes","Parte habitual de la infraestructura civil de comunicaciones, sin ningún riesgo real"]', 1, 14),
  ('En un equipo apilado frente a una puerta, la disciplina de cañón resulta crítica principalmente porque:',
   '["El ruido de las armas se amplifica notablemente en espacios cerrados","Los operadores deben disparar todos al mismo tiempo apenas se abre la puerta","La proximidad física entre compañeros aumenta el riesgo real de fuego amigo","Las reglas de competición lo exigen, sin relación con el combate real"]', 2, 15),
  ('Al usar una carga explosiva para breaching, la distancia de retirada de seguridad del equipo se determina por:',
   '["La preferencia personal del artificiero a cargo de colocar la carga","Un valor fijo de exactamente diez metros, sin ninguna variación posible entre casos","El horario de la operación, retirándose más de día que de noche","El tamaño y tipo de carga junto al material y riesgo de colapso de la estructura"]', 3, 16),
  ('Un francotirador urbano que dispara desde una habitación oscura hacia el exterior iluminado busca principalmente:',
   '["Mejorar la precisión del disparo aprovechando la mayor luz ambiental externa","Ocultar su posición aprovechando el contraste, dificultando ser detectado","Facilitar que su propio equipo lo ubique visualmente desde otra posición","Cumplir un requisito estético sin ninguna función táctica real"]', 1, 17),
  ('Al moverse por un edificio parcialmente colapsado, la prioridad sobre la velocidad de movimiento es:',
   '["Ninguna, la velocidad sigue siendo la prioridad máxima en cualquier entorno urbano","La velocidad importa solo si ya hay contacto enemigo confirmado","La velocidad, porque el colapso ya ocurrió y no queda más riesgo estructural","Verificar la estabilidad de cada superficie antes de aplicar el peso completo"]', 3, 18),
  ('Una puerta que abre hacia adentro de la habitación afecta la técnica de entrada porque:',
   '["La dirección de apertura de la puerta resulta completamente irrelevante para la técnica","Obliga al equipo a usar exclusivamente un breach de tipo explosivo","El operador debe empujarla y entrar en el mismo movimiento, sin tirar de ella antes","Confirma de forma automática que la habitación está vacía de amenazas"]', 2, 19),
  ('Con visibilidad reducida por humo o polvo dentro de una estructura, el equipo debe priorizar:',
   '["Mantener contacto cercano entre compañeros y confirmar identificación antes de disparar","Aumentar la distancia entre operadores para cubrir mayor área posible","Retirarse siempre, sin excepción alguna, ante cualquier reducción de visibilidad del entorno","Cambiar a fuego automático sostenido para compensar la falta de visión"]', 0, 20),
  ('Si el equipo encuentra civiles no combatientes durante el despeje de una estructura, la acción inmediata correcta es:',
   '["Continuar el despeje ignorándolos por completo hasta terminar la misión","Emplear la fuerza mínima necesaria para neutralizarlos como posible amenaza","Detener la misión de forma completa e indefinida ante su presencia","Controlarlos y moverlos a un punto seguro, alejado de las líneas de fuego"]', 3, 21),
  ('En una intersección en forma de T dentro de un edificio, el equipo debe despejar:',
   '["Solo la dirección de avance principal, dejando de lado los corredores laterales","Ambos lados del corredor lateral antes de cruzar por completo la intersección","Únicamente el lado izquierdo del corredor, siguiendo una convención fija","La intersección no exige ningún procedimiento distinto a un pasillo recto"]', 1, 22),
  ('La ventaja principal de un "double stack" sobre un "single stack" al entrar a una habitación grande es:',
   '["Permite dominar ambos lados de la habitación de inmediato, reduciendo la exposición","Requiere solamente la mitad de los operadores para poder ejecutarse","Resulta considerablemente más silencioso que un single stack tradicional en la práctica","Elimina por completo la necesidad de despejar los rincones del espacio"]', 0, 23),
  ('El uso de equipo térmico en operaciones urbanas nocturnas se ve limitado principalmente porque:',
   '["No logra detectar objetivos humanos, solo vehículos y maquinaria pesada","Solo funciona correctamente en exteriores, nunca dentro de estructuras","Vidrio, metal y paredes gruesas pueden bloquear o distorsionar la firma térmica","Requiere una luz ambiental mínima para funcionar correctamente, igual que la visión nocturna"]', 2, 24),
  ('Después de despejar una estructura, mantener seguridad de 360° durante la búsqueda de sensibles responde a que:',
   '["Es solo un procedimiento burocrático más, sin ninguna justificación táctica real detrás","Un despeje inicial no garantiza que no queden amenazas ocultas o un reingreso enemigo","La búsqueda de sensibles siempre se realiza fuera del edificio, nunca dentro","Este procedimiento solo aplica si el edificio tiene más de un piso"]', 1, 25)
) as t(q, o, c, s);

-- ============================================================
-- Examen 3 — Inteligencia Táctica, PID y Reglas de Enfrentamiento
-- ============================================================
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: Inteligencia Táctica, PID y Reglas de Enfrentamiento'), q, o::jsonb, c, s
from (values
  ('El término PID (Identificación Positiva) en el contexto de reglas de enfrentamiento se refiere a:',
   '["Considerar hostil a cualquier persona armada que sea vista en el área de operaciones","Confirmar la identidad de un individuo solo a partir de su uniforme visible","Tener certeza razonable, con evidencia observable, de que hay una amenaza legítima","Un procedimiento puramente administrativo que se completa tras el combate"]', 2, 1),
  ('El análisis de "patrón de vida" de un área se realiza principalmente para:',
   '["Documentar de forma general el clima y la geografía propia de la zona","Cumplir un simple requisito de reporte sin ninguna aplicación operacional real posterior","Determinar la cantidad exacta de habitantes que tiene una zona dada","Detectar anomalías respecto al comportamiento normal que sugieran actividad hostil"]', 3, 2),
  ('La diferencia entre "acto hostil" e "intención hostil" en las reglas de enfrentamiento es que:',
   '["El acto hostil ya ocurrió, la intención es una amenaza inminente demostrada por acciones previas","Son términos sinónimos que exigen exactamente la misma respuesta","La intención hostil solo puede aplicarse a fuerzas enemigas uniformadas","El acto hostil, por su propia definición, no habilita ningún tipo de respuesta con fuerza armada"]', 0, 3),
  ('La secuencia típica de escalada de fuerza ante un vehículo que no se detiene en un checkpoint es:',
   '["Disparar directamente al motor del vehículo sin ningún aviso previo","Señales visuales y verbales, advertencia con arma, disparos de advertencia y luego fuerza letal","Aplicar fuerza letal de inmediato en todos los casos posibles para eliminar cualquier riesgo percibido","Solo se permite usar bocinas o luces, nunca ningún tipo de armamento"]', 1, 4),
  ('Al evaluar la fiabilidad de una fuente de inteligencia humana (HUMINT), un factor clave a considerar es:',
   '["Que la fuente resulta siempre completamente confiable por el simple hecho de ser un civil local","Que solo importa la cantidad de información entregada, no tanto su calidad real","Que la fiabilidad no puede evaluarse hasta después de concluida la operación","Su historial de precisión previa y si la información puede corroborarse de forma independiente"]', 3, 5),
  ('Un grupo de civiles que evita el contacto visual y cambia de dirección al notar a la patrulla puede interpretarse como:',
   '["Un posible indicador de comportamiento anómalo que amerita mayor observación","Confirmación automática de intención hostil que habilita fuerza letal de inmediato","Un comportamiento sin ninguna relevancia táctica en el contexto de la misión","Prueba definitiva de que forman parte de fuerzas enemigas uniformadas"]', 0, 6),
  ('La diferencia entre las Reglas de Enfrentamiento (ROE) y un Procedimiento Operativo Estándar (SOP) es que:',
   '["Ambos términos se usan de forma idéntica e intercambiable en cualquier contexto operacional dado","Las ROE definen cuándo y cómo usar la fuerza legalmente; el SOP define cómo ejecutar tareas","El SOP posee mayor autoridad legal que las ROE en cualquier situación dada","Las ROE aplican únicamente a oficiales, nunca al personal de tropa"]', 1, 7),
  ('Fallar en establecer una identificación positiva antes de emplear fuerza letal puede resultar en:',
   '["Ninguna consecuencia relevante si la misión se cumple de todas formas","Solamente una sanción administrativa menor, sin ninguna otra implicancia posterior real o legal","Daño a no combatientes y pérdida de legitimidad operacional, entre otras consecuencias graves","Una mejora inesperada en la percepción que tiene la población local"]', 2, 8),
  ('El propósito principal de la Preparación de Inteligencia del Campo de Batalla (IPB) es:',
   '["Anticipar terreno, clima y comportamiento probable del enemigo para la planificación","Reemplazar por completo la necesidad de reconocimiento físico del terreno","Un simple trámite administrativo posterior a la operación, sin uso real en la planificación","Un proceso que solo aplica a operaciones de más de una semana de duración"]', 0, 9),
  ('Un "Área de Interés Designada" (NAI) dentro del proceso de inteligencia es:',
   '["La ubicación exacta donde se encuentra situado el cuartel general propio","Una zona donde se espera observar actividad que confirme o descarte una hipótesis","Un área en la que está completamente prohibido cualquier movimiento de tropas propias","Un sinónimo exacto y directo de lo que se conoce como zona de aterrizaje"]', 1, 10),
  ('El principio de "proporcionalidad" en las reglas de enfrentamiento exige que:',
   '["Se emplee siempre la máxima fuerza disponible para asegurar el éxito de la misión","La fuerza empleada sea exactamente igual en cualquier escenario, sin importar el contexto real","El nivel de fuerza sea razonable respecto a la amenaza percibida, evitando daño excesivo","Este principio se aplique únicamente en operaciones con apoyo aéreo directo"]', 2, 11),
  ('Ante un individuo armado sin uniforme ni insignia clara en zona de conflicto, la evaluación correcta debe considerar:',
   '["Asumir de forma automática y sin ningún análisis previo que es combatiente enemigo por portar un arma","Asumir de forma automática que es civil por el simple hecho de no vestir uniforme","Ignorar la situación completa hasta recibir una orden directa del mando superior","El contexto completo: comportamiento, ubicación, actividad previa y normas locales sobre armas"]', 3, 12),
  ('Al manejar a un informante local, la seguridad operacional exige principalmente:',
   '["Publicitar abiertamente la colaboración para generar mayor confianza en la comunidad local","Proteger su identidad y minimizar el contacto visible que pueda exponerlo a represalias","Reunirse siempre en el mismo lugar y horario para mantener cierta consistencia","Compartir su identidad con todo el equipo, sin ninguna restricción de acceso"]', 1, 13),
  ('Vehículos estacionados de forma inusual, ausencia repentina de civiles y vigilancia aparente en una ruta habitual son indicadores clásicos de:',
   '["Una feria o evento comunitario que se organiza de forma habitual en la zona","Actividad completamente normal, sin ninguna relevancia para la misión","Posible preparación de una emboscada, que amerita alerta elevada y cambio de ruta","Mejoras recientes de infraestructura vial realizadas por las propias autoridades locales"]', 2, 14),
  ('La diferencia entre identificación de blanco "hasty" (apresurada) y "deliberada" es que:',
   '["Ambas exigen exactamente el mismo tiempo de análisis antes de decidir","La identificación hasty resulta siempre más precisa por ser puramente instintiva","La identificación deliberada nunca se emplea en combate real, solo se usa en el entrenamiento básico inicial","La hasty ocurre bajo presión de tiempo con información limitada; la deliberada permite más análisis"]', 3, 15),
  ('Si un individuo que mostraba intención hostil la baja y se retira sin disparar, la reevaluación correcta de la amenaza debe:',
   '["Reconocer que la amenaza inmediata pudo haber cesado, ajustando la respuesta en consecuencia","Mantener la fuerza letal de forma completamente automática, ya que la intención inicial ya la justificó","Ignorar por completo el cambio de comportamiento observado en el individuo","Esperar confirmación escrita del mando antes de realizar cualquier ajuste"]', 0, 16),
  ('El ciclo de inteligencia sigue generalmente el orden:',
   '["Análisis del terreno, difusión inmediata, planificación posterior y luego recolección","Recolección de datos, difusión directa, planificación y análisis final","Planificación y dirección, recolección, procesamiento y análisis, y difusión","Difusión inicial, análisis posterior, recolección y planificación al final"]', 2, 17),
  ('El formato de reporte SALUTE (Tamaño, Actividad, Ubicación, Unidad, Tiempo, Equipo) se usa principalmente para:',
   '["Transmitir observaciones de inteligencia de campo de forma estructurada al mando","Solicitar apoyo de fuego indirecto de forma exclusiva y sin otro propósito","Reportar bajas propias de forma exclusiva durante todo el desarrollo de la misión","Coordinar exclusivamente los movimientos logísticos de reabastecimiento"]', 0, 18),
  ('Al planificar un ataque con fuego indirecto cerca de una zona con posible presencia civil, la estimación de daño colateral debe considerar:',
   '["Únicamente la precisión técnica del sistema de armas que se va a emplear","Solo el tamaño del objetivo militar, dejando de lado por completo el entorno","Que resulta del todo innecesaria si la misión tiene una prioridad operacional muy alta","La probabilidad y severidad del daño a no combatientes e infraestructura protegida"]', 3, 19),
  ('Cuando dos fuentes de inteligencia independientes confirman el mismo dato sin haber tenido contacto entre sí, esto:',
   '["No aporta ningún valor adicional respecto a contar con una sola fuente confiable","Aumenta de forma significativa la confiabilidad mediante corroboración independiente","Indica de forma automática que ambas fuentes forman parte de un mismo engaño coordinado","Solo resulta válido si ambas fuentes comparten la misma nacionalidad de origen"]', 1, 20),
  ('La doctrina sobre disparos de advertencia dentro de la escalada de fuerza establece que:',
   '["Se emplean como paso intermedio antes de la fuerza letal, dirigidos de forma segura","Deben dispararse siempre directamente hacia el sospechoso para captar mejor su atención","Están prohibidos en absolutamente todas las circunstancias sin excepción posible","Reemplazan por completo la necesidad de una identificación positiva posterior"]', 0, 21),
  ('Un mercado que normalmente está lleno de gente y aparece completamente vacío a una hora habitual sugiere:',
   '["Un día festivo local que no reviste ninguna relevancia táctica en ningún caso","Simples cambios de clima que no requieren ninguna atención adicional por parte del equipo","Posible advertencia previa a la población de un evento hostil inminente en la zona","Que el mercado cerró de forma permanente por razones puramente económicas"]', 2, 22),
  ('Al capturar documentos o dispositivos electrónicos de un objetivo, mantener la "cadena de custodia" significa:',
   '["Traducir el contenido del material de inmediato en el propio terreno antes de reportar","Documentar y preservar el manejo del material para mantener su validez como evidencia","Destruir el material capturado si no parece relevante a primera vista","Compartir el contenido de forma pública para verificar entre todos su autenticidad"]', 1, 23),
  ('Una "lista de no-ataque" en la planificación operacional existe para:',
   '["Marcar los objetivos que tienen mayor prioridad militar dentro de la operación","Indicar las zonas donde el enemigo concentra la mayor cantidad de sus fuerzas","Reemplazar por completo el proceso normal y establecido de identificación positiva de blancos","Proteger ubicaciones como hospitales o sitios religiosos de ataques planificados"]', 3, 24),
  ('El valor de inteligencia de un debrief post-acción detallado radica en que:',
   '["Sirve únicamente para fines disciplinarios internos dentro de la propia unidad militar","No aporta ninguna información nueva una vez que la misión ya fue completada","Puede revelar detalles del terreno que alimenten futuras operaciones de inteligencia","Solo resulta obligatorio realizarlo si la misión terminó en un fracaso"]', 2, 25)
) as t(q, o, c, s);

-- ============================================================
-- Examen 4 — Logística de Combate y Seguridad de Comunicaciones
-- ============================================================
insert into public.quiz_questions (quiz_id, question, options, correct_index, sort_order)
select (select id from public.quizzes where title = 'Examen: Logística de Combate y Seguridad de Comunicaciones'), q, o::jsonb, c, s
from (values
  ('El propósito principal de la Seguridad de Comunicaciones (COMSEC) es:',
   '["Aumentar el alcance físico efectivo de la señal de radio transmitida","Reducir de forma notable el consumo de batería de los equipos de radio en el terreno","Mejorar en general la calidad de audio percibida en las transmisiones","Impedir que el enemigo intercepte, decodifique o explote las comunicaciones propias"]', 3, 1),
  ('El "salto de frecuencia" en radios tácticas existe principalmente para:',
   '["Dificultar que el enemigo intercepte o interfiera la señal al cambiar de frecuencia","Lograr un ahorro considerable de batería en el equipo de radio que se está usando en ese momento","Mejorar de forma directa el alcance máximo posible de la transmisión","Permitir transmitir en varios canales de radio de forma simultánea"]', 0, 2),
  ('En el sistema de triage START, la categoría de una víctima que respira solo al reposicionar la vía aérea, con relleno capilar lento, es:',
   '["Menor (verde), pudiendo caminar y esperar atención sin mayor urgencia","Inmediata (roja), requiriendo atención prioritaria de forma urgente","Diferida (amarilla), pudiendo esperar atención sin riesgo inmediato","Fallecida (negra), al no presentar ningún signo vital detectable"]', 1, 3),
  ('En la clasificación de precedencia de evacuación médica, la categoría "Urgente" se asigna cuando:',
   '["No existe riesgo de vida y la evacuación puede esperar más de 24 horas sin problema","El paciente ya fue estabilizado por completo y solo resta el traslado administrativo","La condición pone en riesgo vida, extremidad o vista si no se evacúa en pocas horas","Esta categoría se reserva únicamente para bajas de personal de mando"]', 2, 4),
  ('Un plan PACE (Primario, Alterno, de Contingencia, de Emergencia) para comunicaciones significa que:',
   '["El equipo define varios métodos de comunicación en orden de preferencia por si el principal falla","Solo se permite usar un único método de comunicación posible durante toda la misión que fue asignada","PACE corresponde al nombre propio de un protocolo específico de cifrado","Este plan aplica de forma exclusiva a las comunicaciones satelitales"]', 0, 5),
  ('El término de brevedad "Winchester" transmitido por radio significa que la unidad:',
   '["Está solicitando apoyo aéreo de forma inmediata para la posición actual","Se ha quedado sin munición disponible para continuar el combate","Confirma la destrucción efectiva del objetivo que tenía asignado","Se encuentra lista para iniciar el asalto sobre el objetivo previsto"]', 1, 6),
  ('Un piloto que reporta "Bingo fuel" está indicando que:',
   '["Completó su misión asignada de forma exitosa y sin contratiempos","Detectó una amenaza aérea enemiga durante el desarrollo del vuelo","Alcanzó el nivel mínimo de combustible necesario para regresar de forma segura","Solicita autorización inmediata para atacar un nuevo objetivo detectado durante el vuelo"]', 2, 7),
  ('Al realizar un chequeo de radio y recibir la respuesta "Lima Charlie", esto significa que:',
   '["La transmisión no se está recibiendo en absoluto en el otro extremo","Se está solicitando repetir el mensaje completo por mala recepción","Existe interferencia parcial notable que afecta la calidad de la señal","La señal se recibe fuerte y clara, sin ningún problema de recepción"]', 3, 8),
  ('Transmitir información operacional sensible en voz clara sin cifrado, frente a un canal cifrado, representa:',
   '["Exactamente el mismo nivel de riesgo operacional en ambos casos posibles","Un riesgo mayor de que el enemigo obtenga inteligencia útil al interceptarla","Un riesgo menor, ya que la voz clara resulta siempre más difícil de grabar después","Ningún riesgo real si la transmisión dura menos de diez segundos en total"]', 1, 9),
  ('Ruido constante, estática inusual o silencio total en todos los canales de radio a la vez puede indicar:',
   '["Una falla menor de batería que afecta únicamente a la propia radio","Condiciones climáticas que en la práctica nunca afectan la radiofrecuencia","Posible interferencia electrónica (jamming) enemiga activa en la zona","Un procedimiento de mantenimiento programado, sin relevancia táctica alguna"]', 2, 10),
  ('Mantener un intervalo de distancia adecuado entre vehículos de un convoy tiene como propósito principal:',
   '["Facilitar que todos los vehículos del convoy mantengan exactamente la misma velocidad","Reducir de forma notable el consumo de combustible del convoy completo","Permitir una mejor visibilidad del paisaje para los ocupantes del vehículo","Limitar que un solo ataque afecte a más de un vehículo del convoy a la vez"]', 3, 11),
  ('Al establecer un caché de suministros en territorio hostil, una consideración de seguridad clave es:',
   '["Evitar patrones predecibles de ubicación y marcarlo solo para personal autorizado","Ubicarlo siempre en el punto más visible posible para facilitar su localización","Documentar su ubicación exacta por radio sin cifrar para agilizar mejor la coordinación","Los cachés de suministros no requieren ninguna consideración de seguridad extra"]', 0, 12),
  ('En el formato de nueve líneas (9-line MEDEVAC), la línea de equipo médico especial existe para que:',
   '["El comandante de la misión apruebe formalmente el uso de recursos adicionales","Se calcule con precisión el costo total asociado a la evacuación médica","La tripulación de evacuación llegue preparada con el equipo adecuado al caso","Se determine con claridad qué unidad recibe el crédito por el rescate"]', 2, 13),
  ('Al gestionar prisioneros o detenidos capturados en una operación, el procedimiento táctico básico prioriza:',
   '["Interrogarlos de inmediato en el propio punto de captura antes de cualquier otra acción","Liberarlos en el lugar si no representan una amenaza inmediata visible","Ignorarlos por completo y continuar la misión sin asignarles recursos","Asegurarlos, registrarlos y trasladarlos de forma controlada, evitando maltrato"]', 3, 14),
  ('Bajo contacto sostenido con el enemigo, si el equipo debe priorizar un único reabastecimiento urgente, generalmente se prioriza:',
   '["La munición, ya que sin ella no puede sostener el combate ni replegarse con seguridad","Los alimentos, para mantener la energía general del equipo en combate","El equipo de comodidad personal de cada uno de los operadores","El combustible destinado a vehículos que no se encuentran presentes en la posición actual"]', 0, 15),
  ('Mantener silencio de emisiones (EMCON) durante una infiltración busca principalmente:',
   '["Lograr un ahorro considerable de batería en los equipos de comunicación usados","Evitar que el enemigo detecte la presencia o posición del equipo por intercepción","Cumplir un simple requisito puramente administrativo, sin relación con la táctica real","Facilitar en la práctica la comunicación con unidades aliadas cercanas"]', 1, 16),
  ('La disciplina de usar indicativos de llamada en vez de nombres reales por radio existe porque:',
   '["Los nombres reales están prohibidos por simples razones estéticas de protocolo","Los indicativos resultan simplemente más cortos, ahorrando únicamente tiempo de transmisión","Se trata solo de una tradición sin ninguna función real de seguridad","Dificulta que una intercepción enemiga identifique a personal específico o su rol"]', 3, 17),
  ('Una tabla de autenticación (challenge-response) usada por radio sirve para:',
   '["Traducir mensajes entre distintos idiomas durante una transmisión radial conjunta","Verificar que quien transmite es realmente una estación amiga y no el enemigo","Medir de forma directa la potencia real de la señal de radio recibida","Registrar con precisión el horario exacto de cada transmisión realizada"]', 1, 18),
  ('El propósito de establecer un Punto de Recolección de Bajas (CCP) durante una operación es:',
   '["Centralizar la atención y estabilización de heridos en un punto protegido","Servir como punto de reunión general para todo el personal al final de la misión","Almacenar en un solo lugar las municiones y el equipo no utilizado","Ubicar al comandante de la operación durante el desarrollo del combate"]', 0, 19),
  ('Llevar un registro del consumo de munición durante una operación prolongada tiene como función:',
   '["Cumplir un simple requisito puramente administrativo sin ningún impacto real en la misión","Determinar posibles sanciones por un uso considerado excesivo de recursos","Anticipar cuándo el equipo va a necesitar reabastecimiento antes de quedarse sin munición","Calcular de forma precisa el costo económico total de la operación"]', 2, 20),
  ('La orden de brevedad "Check fire" transmitida durante un intercambio de disparos significa:',
   '["Aumentar la cadencia de disparo del equipo hasta el máximo posible","Detener el fuego de inmediato, por riesgo de fuego amigo o de no combatientes","Confirmar de forma explícita que el objetivo asignado fue destruido","Solicitar de inmediato más munición al punto de reabastecimiento disponible más cercano"]', 1, 21),
  ('En terreno montañoso donde la línea de vista de radio se ve interrumpida, establecer una estación de relevo sirve para:',
   '["Aumentar directamente la potencia de transmisión de la propia radio original usada","Cifrar de forma más segura las comunicaciones que se van a transmitir","Reemplazar por completo la necesidad de contar con un plan PACE","Retransmitir la señal entre dos puntos sin comunicación directa por el terreno"]', 3, 22),
  ('Dentro de las clases de abastecimiento militar, el combustible para vehículos y generadores corresponde a:',
   '["Clase I, la misma categoría reservada exclusivamente para el abastecimiento de alimentos","Clase V, la categoría normalmente reservada para munición de combate","Clase III, la categoría específicamente reservada para combustibles y lubricantes","Clase IX, la categoría reservada para repuestos y piezas de reparación"]', 2, 23),
  ('Depender de un único método de comunicación sin ninguna alternativa representa un riesgo porque:',
   '["Una falla técnica o pérdida de línea de vista puede dejar al equipo incomunicado","Los métodos alternativos de comunicación siempre resultan mucho más lentos y sin valor real","No existe ningún riesgo real si el equipo cuenta con buen entrenamiento previo","Las radios de tipo VHF, en la práctica, nunca fallan en combate normal"]', 0, 24),
  ('Al solicitar reabastecimiento después de un contacto prolongado, el orden de prioridad más común es:',
   '["Comodidades personales primero, seguidas luego de agua y recién por último la munición","Combustible en primer lugar, luego alimentos y comodidades personales","Alimentos primero, seguidos de agua y recién después el combustible","Munición primero, luego agua o insumos médicos, y el resto según la situación"]', 3, 25)
) as t(q, o, c, s);
