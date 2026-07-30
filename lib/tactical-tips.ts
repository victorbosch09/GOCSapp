export const TACTICAL_TIPS: { title: string; body: string }[] = [
  {
    title: "CQB — Ángulos de entrada",
    body: "Al entrar a una habitación, cortá el ángulo hacia el lado contrario de la bisagra de la puerta primero (el 'punto fatal' suele estar detrás de la hoja). No te pares en el vano — es el punto donde más tiempo estás expuesto desde todos los ángulos.",
  },
  {
    title: "CQB — Dominancia de espacio",
    body: "El primer hombre en entrar domina el rincón más lejano y profundo, no el más cercano. El segundo hombre cubre el rincón cercano. Nunca dos operadores apuntan al mismo sector — dividan la habitación en cuartos.",
  },
  {
    title: "MOUT — Movimiento entre edificios",
    body: "Cruzá calles y espacios abiertos en diagonal y a la carrera, nunca perpendicular y caminando. El tiempo de exposición en una intersección urbana es el factor que más bajas genera en combate MOUT.",
  },
  {
    title: "MOUT — Verticalidad",
    body: "En zonas urbanas pensá en tres dimensiones: azoteas, pisos superiores y sótanos son tan relevantes como la calle. Un equipo que solo mira al frente en altura similar es vulnerable a fuego de arriba.",
  },
  {
    title: "Repliegue — Bounding por parejas",
    body: "En un repliegue bajo fuego, un elemento se mueve mientras el otro fija con fuego de supresión — nunca los dos se mueven al mismo tiempo. Comuniquen claramente 'moviendo' y 'en posición' para no perder la cobertura mutua.",
  },
  {
    title: "Repliegue — Rutas alternativas",
    body: "Nunca repliegues por la misma ruta que usaste para avanzar si podés evitarlo — el enemigo pudo haberla marcado o emboscado. Definí un punto de reunión (rally point) antes de iniciar cualquier movimiento ofensivo.",
  },
  {
    title: "Saltos escalonados (bounding overwatch)",
    body: "Cada elemento avanza una distancia corta (regla general: no más de lo que el elemento de cobertura puede vigilar con eficacia, típicamente 50-100m en campo abierto) antes de tomar posición y cubrir al siguiente salto.",
  },
  {
    title: "Enumeración de objetivos",
    body: "Al ver múltiples amenazas, enumerá en voz alta de izquierda a derecha o por prioridad de peligro ('Contacto, dos, izquierda a 200'). Esto evita que dos tiradores dupliquen fuego sobre el mismo blanco mientras otro queda sin cubrir.",
  },
  {
    title: "Coordinación — Brevity words",
    body: "Usá palabras cortas y estandarizadas por radio ('Contacto', 'Retirada', 'Reagrupar', 'Despejado') en vez de frases largas. En combate, cada segundo de radio ocupado es un segundo que otro no puede reportar algo crítico.",
  },
  {
    title: "Coordinación — Interlocking fields of fire",
    body: "Al ocupar posiciones defensivas, cada arma debe cubrir el sector muerto del arma vecina. Si todos apuntan al frente, los flancos quedan abiertos — coordiná los sectores de tiro antes de que empiece el contacto, no durante.",
  },
  {
    title: "Conciencia situacional — Regla del 5/25",
    body: "Al detenerte, escaneá primero un radio de 5 metros (amenazas inmediatas, trampas) y después hasta 25 metros (cobertura, rutas, enemigos). Se hace en cada alto, no solo al llegar a un objetivo.",
  },
  {
    title: "Conciencia situacional — Reloj táctico",
    body: "Referenciá direcciones como las agujas de un reloj relativas a la dirección de marcha del equipo ('contacto en las 3') en vez de norte/sur — es más rápido de procesar bajo estrés y no depende de que todos miren un mapa.",
  },
  {
    title: "Técnicas de asalto — Fuego y movimiento",
    body: "Un asalto exitoso combina supresión constante con avance escalonado — nunca dejes de generar fuego efectivo mientras el elemento de asalto avanza. El silencio del arma de apoyo es la señal que el enemigo espera para reaccionar.",
  },
  {
    title: "Técnicas de asalto — Consolidación",
    body: "Tras tomar un objetivo, la tentación es relajarse — es el momento de mayor vulnerabilidad a un contraataque. Consolidá posiciones, reorganizá munición y establecé seguridad de 360° antes de celebrar nada.",
  },
  {
    title: "Defensa — Posiciones escalonadas",
    body: "Armá al menos dos o tres líneas de defensa en profundidad, no una sola línea. Si la primera cae, la segunda debe poder cubrir la retirada de quienes venían replegándose desde la primera.",
  },
  {
    title: "Defensa — Campos de tiro despejados",
    body: "Antes de fijar una posición defensiva, despejá vegetación u obstáculos que bloqueen tu línea de visión hacia las rutas de aproximación probables del enemigo. Una posición ciega no sirve aunque tenga buena cobertura física.",
  },
  {
    title: "Formaciones — Cuña (wedge)",
    body: "La formación en cuña da buena cobertura 360° con fuego máximo al frente — ideal en terreno abierto. En espacios cerrados o vegetación densa, pasá a fila (file) para mantener control visual y de comunicación.",
  },
  {
    title: "Formaciones — Distancia entre operadores",
    body: "Mantené distancia suficiente entre compañeros para que una granada o ráfaga no comprometa a dos personas a la vez, pero no tanta que se pierda el contacto visual o de comunicación en terreno complejo.",
  },
  {
    title: "Manejo del armamento — Transiciones",
    body: "Practicá la transición de fusil a pistola en fallo de arma principal (doble tap al pecho + traba, transición inmediata) en vez de intentar despejar el fallo bajo fuego directo — resolvé el fallo cuando ya estés a cubierto.",
  },
  {
    title: "Manejo del armamento — Gestión de munición",
    body: "Cambiá cargador en un momento táctico (detrás de cobertura, en una pausa del contacto), no cuando se vacía por completo si podés evitarlo. Un 'reload táctico' con cargador parcial es mejor que quedarte en seco en mitad de un intercambio.",
  },
  {
    title: "Comunicación — Reportes SALUTE",
    body: "Al reportar contacto o inteligencia, usá el formato Size-Activity-Location-Unit-Time-Equipment (tamaño, actividad, ubicación, unidad, hora, equipo). Da al mando lo que necesita para decidir sin preguntas de seguimiento.",
  },
];

/** Rotación diaria estable — todos ven el mismo tip el mismo día, cambia a la medianoche. */
export function getTodayTip() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TACTICAL_TIPS[dayOfYear % TACTICAL_TIPS.length];
}
