// Reglas de Desempeño: puestos y KPIs, asistencia (ponche), KPIs del tablero Producción, score y
// permisos. Puro (sin DB ni "@/"): lo prueban tests/desempeno.test.mjs y lo usan el panel y el cron.
//
// Principio (Elvin, 25/sep/2026): medir asistencia, cumplimiento y resultados por puesto SIN vigilar.
// Todo lo medible sale de las herramientas; el empleado solo reporta bloqueos y lo que no se ve.
// Nadie se pone su propia nota: las tareas y fechas las crea quien pide, las revisiones las marca
// quien revisa, y los resultados vienen de Meta / n8n / Chatwoot (fase 2).

// ─── Puestos y KPIs ────────────────────────────────────────────────────────────────────────────

export type Fuente = "produccion" | "pulse" | "meta" | "n8n" | "nocodb" | "chatwoot" | "slack" | "manual";
export type Sentido = "mayor" | "menor" | "info";

export interface Kpi {
  id: string;
  nombre: string;
  fuente: Fuente;
  sentido: Sentido; // mayor = más es mejor · menor = menos es mejor · info = no puntúa
  meta: number;
  peso: number; // relativo dentro del puesto; 0 = no entra al score
  unidad?: "%" | "min" | "u";
  ayuda?: string;
}

export interface Puesto {
  id: string;
  nombre: string;
  departamento: string;
  kpis: Kpi[];
  manual?: { id: string; nombre: string; detalle?: string; dinero?: boolean }[]; // lo que reporta al marcar salida (además de bloqueos); `detalle` = pregunta del texto (qué cliente, cuál…); `dinero` = monto en US$
  sinPonche?: boolean; // ventas: no ponchan; su desempeño es 100 % resultados (Arena, lib/ventas/reglas.ts)
  // No poncha, pero llena su reporte del día en Hoy (30/sep, Lis): sigue en Equipo/Ranking; su "asistencia" = si reportó.
  soloReporte?: boolean;
}

// KPIs de Producción (editores, diseñadores, copy, web): ventana móvil de 7 días.
const kpisTablero = (terminadasSemana: number): Kpi[] => [
  { id: "entregas_a_tiempo", nombre: "Entregas a tiempo", fuente: "produccion", sentido: "mayor", meta: 90, peso: 3, unidad: "%", ayuda: "Primera entrega (En revisión o Listo) antes de la fecha límite" },
  { id: "terminadas", nombre: "Terminadas (7 días)", fuente: "produccion", sentido: "mayor", meta: terminadasSemana, peso: 2, unidad: "u" },
  { id: "revisiones", nombre: "Revisiones por entrega", fuente: "produccion", sentido: "menor", meta: 1, peso: 2, ayuda: "Veces que quien pidió la devolvió a Cambios" },
  { id: "vencidas", nombre: "Vencidas", fuente: "produccion", sentido: "menor", meta: 0, peso: 3, unidad: "u" },
  { id: "backlog", nombre: "Backlog", fuente: "produccion", sentido: "info", meta: 0, peso: 0, unidad: "u" },
];

const reuniones = [{ id: "reuniones_cliente", nombre: "Reuniones con clientes hoy" }];

// KPIs que reporta la persona al marcar salida (Elvin, 28/sep: "los primeros KPIs… lo demás quítalo por ahora"). Nacen
// con peso 0 (se miden, no puntúan) hasta que Carilin/RR.HH. les pongan meta y peso en Ajustes.
const reportado = (id: string, nombre: string, detalle: string, ayuda?: string, dinero?: boolean) => ({
  kpi: { id, nombre, fuente: "manual" as const, sentido: "mayor" as const, meta: 1, peso: 0, unidad: "u" as const, ayuda },
  manual: { id, nombre, detalle, ...(dinero ? { dinero: true } : {}) },
});
const KPIS_REPORTADOS = {
  estratega: [
    reportado("reuniones_cliente", "Reuniones con clientes", "¿Con qué clientes?"),
    reportado("campanas", "Campañas realizadas", "¿De qué clientes?"),
    reportado("aprobados", "Planes, investigaciones y creativos aprobados", "¿Cuáles y de qué cliente?", "Planes de marketing, investigaciones de mercado, flyers, videos o creativos APROBADOS y listos para ejecutar (no solo pedidos)"),
  ],
  pm: [
    reportado("onboardings", "Onboardings realizados", "¿De qué clientes?"),
    reportado("conversaciones", "Conversaciones con clientes", "¿Con quiénes?", "Clientes que te respondieron y hablaste con ellos, por teléfono o chat (no mensajes enviados)"),
    reportado("casos_resueltos", "Casos solucionados", "¿Cuál caso y de qué cliente?", "Bloqueos o problemas de un cliente que quedaron resueltos"),
    // 30/sep (Elvin): también los clientes que contactó (Jessica y Ángela).
    reportado("clientes_contactados", "Clientes contactados", "¿A quiénes?", "Clientes a los que les escribiste o llamaste hoy, aunque no hayan contestado"),
  ],
  // 30/sep (Elvin, para Garrys): proyectos nuevos que comenzó, reuniones de onboarding y soporte a sistemas.
  ai_engineer: [
    reportado("proyectos_nuevos", "Proyectos nuevos comenzados", "¿Cuál y para quién? (AutoFlow, sistema nuevo, agente personalizado)", "Proyectos que empezaste hoy: un AutoFlow, un sistema nuevo o un agente personalizado"),
    reportado("reuniones_onboarding", "Reuniones de onboarding", "¿De qué clientes?"),
    reportado("soporte", "Soporte a sistemas", "¿Qué sistema, de qué cliente y qué fue?", "Arreglos, ajustes o dudas resueltas de un sistema que ya está funcionando"),
  ],
  // 30/sep (Elvin, para Lis): retención (referidos, seguimiento, lista de churn), proyectos especiales y alianzas.
  retencion_alianzas: [
    reportado("referidos", "Referidos conseguidos", "¿De quién y para qué marca?"),
    reportado("seguimiento", "Conversaciones de seguimiento con clientes potenciales", "¿Con quiénes?", "Personas con las que hablaste para darle seguimiento (no mensajes sin respuesta)"),
    reportado("churn_contactados", "Clientes de la lista de churn contactados", "¿Cuáles?"),
    reportado("churn_conversaron", "Clientes de churn con los que conversaste", "¿Cuáles y qué dijeron?", "De los que contactaste, los que te respondieron"),
    reportado("proyectos_especiales", "Proyectos especiales de EA Market LLC", "¿Cuál?"),
    reportado("alianzas", "Contactos para alianzas, colaboradores o creadores", "¿Quiénes y para qué marca?"),
    // 30/sep (Elvin): también ventas.
    reportado("reuniones_seguimiento", "Reuniones agendadas para seguimiento de ventas", "¿Con quiénes?"),
    reportado("cash_collected", "Cash collected cerrado (US$)", "¿De quién y qué servicio?", "Lo que cobraste tú hoy, en dólares", true),
    reportado("ventas_bori", "Ventas de Bori", "¿A quién?", "Ventas del producto Bori (low ticket) que cerraste tú"),
  ],
  disenador: [
    reportado("flyers_aprobados", "Flyers y creativos aprobados", "¿Cuántos por negocio? (ej.: 6 Dra. Escabí, 3 Tinos)", "Solo los aprobados por el cliente o el estratega"),
    reportado("otros_disenos", "Otros diseños (logo, presentación…)", "¿Cuáles y para quién?"),
  ],
};
const kpisReportados = (k: keyof typeof KPIS_REPORTADOS) => KPIS_REPORTADOS[k].map((x) => x.kpi);
const manualReportado = (k: keyof typeof KPIS_REPORTADOS) => KPIS_REPORTADOS[k].map((x) => x.manual);

export const PUESTOS: Puesto[] = [
  {
    id: "pm",
    nombre: "Project Manager",
    departamento: "Cuentas",
    manual: manualReportado("pm"),
    kpis: kpisReportados("pm"),
  },
  {
    id: "estratega",
    nombre: "Estratega Digital", // 30/sep, Elvin: "ese es su puesto"
    departamento: "Estrategia y tráfico",
    manual: manualReportado("estratega"),
    kpis: kpisReportados("estratega"),
  },
  {
    id: "media_buyer",
    nombre: "Media Buyer",
    departamento: "Estrategia y tráfico",
    manual: reuniones,
    kpis: [
      { id: "cuentas_revisadas", nombre: "Cuentas revisadas", fuente: "n8n", sentido: "mayor", meta: 100, peso: 2, unidad: "%" },
      { id: "campanas_problema", nombre: "Campañas con problemas", fuente: "n8n", sentido: "menor", meta: 2, peso: 2, unidad: "u" },
      { id: "cumplimiento_kpi", nombre: "Cuentas en meta (CPL/CPA/ROAS)", fuente: "meta", sentido: "mayor", meta: 80, peso: 3, unidad: "%" },
      { id: "optimizaciones", nombre: "Optimizaciones", fuente: "meta", sentido: "mayor", meta: 10, peso: 2, unidad: "u" },
    ],
  },
  { id: "editor", nombre: "Editor de video", departamento: "Producción", kpis: kpisTablero(10) },
  { id: "disenador", nombre: "Diseñador", departamento: "Producción", manual: manualReportado("disenador"), kpis: kpisReportados("disenador") },
  { id: "copy", nombre: "Copy / Contenido", departamento: "Producción", kpis: kpisTablero(15) },
  { id: "web", nombre: "Web / Funnels", departamento: "Producción", kpis: kpisTablero(3) },
  {
    id: "soporte",
    nombre: "Customer Success / Soporte",
    departamento: "Customer Success",
    kpis: [
      { id: "recibidas", nombre: "Solicitudes recibidas", fuente: "chatwoot", sentido: "info", meta: 0, peso: 0, unidad: "u" },
      { id: "resueltas", nombre: "Resueltas", fuente: "chatwoot", sentido: "mayor", meta: 90, peso: 3, unidad: "%" },
      { id: "pendientes", nombre: "Pendientes", fuente: "chatwoot", sentido: "menor", meta: 5, peso: 2, unidad: "u" },
      { id: "tiempo_respuesta", nombre: "Tiempo de respuesta", fuente: "chatwoot", sentido: "menor", meta: 15, peso: 3, unidad: "min" },
      { id: "escalaciones", nombre: "Escalaciones", fuente: "chatwoot", sentido: "menor", meta: 1, peso: 1, unidad: "u" },
    ],
  },
  // Puestos sin KPIs conectados todavía (28/sep/2026, pedido de Aure): su nota sale de la asistencia.
  { id: "rrhh", nombre: "RRHH", departamento: "Recursos Humanos", kpis: [] },
  { id: "tesoreria", nombre: "Tesorera", departamento: "Finanzas", kpis: [] },
  { id: "retencion_alianzas", nombre: "Coordinadora de Retención y Alianzas", departamento: "Customer Success", manual: manualReportado("retencion_alianzas"), kpis: kpisReportados("retencion_alianzas"), soloReporte: true },
  { id: "ai_engineer", nombre: "AI Engineer", departamento: "Tecnología", manual: manualReportado("ai_engineer"), kpis: kpisReportados("ai_engineer") },
  // Ventas (Arena, 27/sep/2026): sin ponche ni score de asistencia; lo suyo sale de la hoja de ventas.
  { id: "closer", nombre: "Closer", departamento: "Ventas", kpis: [], sinPonche: true },
  { id: "setter", nombre: "Setter", departamento: "Ventas", kpis: [], sinPonche: true },
  { id: "chatter", nombre: "Chatter", departamento: "Ventas", kpis: [], sinPonche: true },
  { id: "director_ventas", nombre: "Director de ventas", departamento: "Ventas", kpis: [], sinPonche: true },
];

export const sinPonche = (puesto: string | null | undefined) => !!puesto && !!puestoPorId(puesto)?.sinPonche;

// Empresas: la misma plataforma para las dos marcas, pero cada persona identificada (Elvin, 25/sep/2026).
export const EMPRESAS = [
  { id: "level_up", nombre: "Level Up", corto: "LU" },
  { id: "ai_borinquen", nombre: "AI Borinquen", corto: "AIB" },
] as const;
export const empresaPorId = (id: string) => EMPRESAS.find((e) => e.id === id) ?? EMPRESAS[0];

export const DEPARTAMENTOS = [...new Set(PUESTOS.map((p) => p.departamento))];

/**
 * Puestos que RR.HH. crea desde Ajustes (29/sep, Elvin: "que Yaileen pueda hacer cambios menores sin pedirle a Nico").
 * Viven en la base (lib/desempeno/puestos-extra.ts) y se registran aquí en cada request del servidor: nacen sin KPIs
 * (su nota sale de la asistencia) hasta que alguien les defina los suyos.
 */
export function registrarPuestosExtra(extras: { id: string; nombre: string; departamento: string }[]) {
  for (const x of extras) {
    const actual = PUESTOS.find((p) => p.id === x.id);
    if (actual) {
      actual.nombre = x.nombre;
      actual.departamento = x.departamento;
    } else PUESTOS.push({ id: x.id, nombre: x.nombre, departamento: x.departamento, kpis: [] });
    if (!DEPARTAMENTOS.includes(x.departamento)) DEPARTAMENTOS.push(x.departamento);
  }
}

/** Id de un puesto nuevo a partir de su nombre ("Community Manager" → "p_community_manager"). */
export function idPuesto(nombre: string): string {
  return (
    "p_" +
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40)
  );
}
export const puestoPorId = (id: string) => PUESTOS.find((p) => p.id === id);

// Fuentes ya conectadas (fase 1). Las demás se muestran como "por conectar" y no entran al score.
export const FUENTES_CONECTADAS: Fuente[] = ["produccion", "manual"];

export type OverrideMeta = { puesto: string; kpi: string; meta: number; peso: number };

/** KPIs del puesto con las metas/pesos que Carilin haya cambiado. */
export function kpisDe(puestoId: string, overrides: OverrideMeta[] = []): Kpi[] {
  const p = puestoPorId(puestoId);
  if (!p) return [];
  return p.kpis.map((k) => {
    const o = overrides.find((x) => x.puesto === puestoId && x.kpi === k.id);
    return o ? { ...k, meta: o.meta, peso: o.peso } : k;
  });
}

// ─── Fechas (hora de PR: UTC-4 todo el año) ───────────────────────────────────────────────────

const ZONA = "America/Puerto_Rico";

export function fechaPR(d: Date | number): string {
  return new Date(d).toLocaleDateString("en-CA", { timeZone: ZONA });
}

/** Minutos desde la medianoche PR. */
export function minutosPR(d: Date | number): number {
  const [h, m] = new Date(d).toLocaleTimeString("en-GB", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false }).split(":").map(Number);
  return (h % 24) * 60 + m;
}

export function sumarDias(fecha: string, n: number): string {
  const t = Date.parse(`${fecha}T12:00:00Z`) + n * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export function diaSemana(fecha: string): number {
  return new Date(`${fecha}T12:00:00Z`).getUTCDay(); // 0 = domingo
}

export function rangoFechas(desde: string, hasta: string): string[] {
  const out: string[] = [];
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) out.push(f);
  return out;
}

/** Fin del día PR (23:59:59.999) en ms UTC. */
export const finDiaPR = (fecha: string) => Date.parse(`${fecha}T23:59:59.999-04:00`);

export const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

// ─── Asistencia ───────────────────────────────────────────────────────────────────────────────

export const TOLERANCIA_MIN = 15;

export interface Horario {
  horaEntrada: string; // "09:00" PR
  horaSalida: string; // "18:00" PR
  diasLaborables: number[]; // 1 = lunes … 6 = sábado
}

export interface PoncheDia {
  entradaAt: string; // ISO
  salidaAt: string | null;
  correccion?: string | null;
}

export type EstadoAsistencia = "libre" | "pendiente" | "trabajando" | "a_tiempo" | "tarde" | "ausente";

export interface Asistencia {
  estado: EstadoAsistencia;
  puntaje: number | null; // null = no cuenta (día libre o todavía no empieza)
  entrada: string | null; // ISO de la primera entrada
  salida: string | null; // ISO de la última salida
  minutosTarde: number;
  horas: number; // trabajadas (tramos cerrados + el abierto hasta `ahora` si es hoy)
  sinSalida: boolean; // quedó un tramo abierto de un día anterior
  salidaTemprana: boolean;
  correccionPendiente: boolean;
}

/**
 * Asistencia de un día. Horario flexible: si entró tarde pero completó las horas, no se castiga la
 * salida; la puntualidad sí cuenta (tolerancia de 15 min). "Ausencia justificada" llega en fase 3.
 */
export function asistenciaDia(p: { fecha: string; horario: Horario; ponches: PoncheDia[]; ahora: number; desde?: string | null }): Asistencia {
  const { fecha, horario, ahora } = p;
  const hoy = fechaPR(ahora);
  const ponches = [...p.ponches].sort((a, b) => a.entradaAt.localeCompare(b.entradaAt));
  const base: Asistencia = { estado: "libre", puntaje: null, entrada: null, salida: null, minutosTarde: 0, horas: 0, sinSalida: false, salidaTemprana: false, correccionPendiente: false };
  const laborable = horario.diasLaborables.includes(diaSemana(fecha));
  const inicio = aMinutos(horario.horaEntrada);
  const fin = aMinutos(horario.horaSalida);
  const jornadaHoras = Math.max(0, (fin - inicio) / 60 - 1); // 1 h de almuerzo

  if (!ponches.length) {
    if (!laborable || fecha > hoy || (p.desde && fecha < p.desde)) return base; // antes de activarse no cuenta
    if (fecha === hoy && minutosPR(ahora) < inicio + TOLERANCIA_MIN) return { ...base, estado: "pendiente" };
    return { ...base, estado: "ausente", puntaje: 0 };
  }

  let horas = 0;
  let abierto = false;
  let sinSalida = false;
  for (const x of ponches) {
    const e = Date.parse(x.entradaAt);
    if (x.salidaAt && x.correccion !== "rechazada") horas += Math.max(0, Date.parse(x.salidaAt) - e) / 3_600_000;
    else if (fecha === hoy) {
      abierto = true;
      horas += Math.max(0, ahora - e) / 3_600_000;
    } else sinSalida = true;
  }
  const entrada = ponches[0].entradaAt;
  const ultima = ponches.filter((x) => x.salidaAt).map((x) => x.salidaAt!).sort().at(-1) ?? null;
  const minutosTarde = laborable ? Math.max(0, minutosPR(Date.parse(entrada)) - inicio) : 0;
  const tarde = minutosTarde > TOLERANCIA_MIN;
  const salidaTemprana = laborable && !abierto && !sinSalida && !!ultima && minutosPR(Date.parse(ultima)) < fin - TOLERANCIA_MIN && horas < jornadaHoras - 0.25;

  let puntaje = 100;
  if (laborable) {
    if (minutosTarde > 60) puntaje = 50;
    else if (minutosTarde > 30) puntaje = 70;
    else if (tarde) puntaje = 85;
    if (salidaTemprana) puntaje -= 15;
    if (sinSalida) puntaje -= 10;
  }
  return {
    estado: abierto ? "trabajando" : tarde ? "tarde" : "a_tiempo",
    puntaje: laborable ? Math.max(0, puntaje) : null, // trabajar en día libre suma horas, no puntúa
    entrada,
    salida: ultima,
    minutosTarde,
    horas: Math.round(horas * 100) / 100,
    sinSalida,
    salidaTemprana,
    correccionPendiente: ponches.some((x) => x.correccion === "pendiente"),
  };
}

// ─── Tablero Producción ───────────────────────────────────────────────────────────────────────

// Estados del tablero (ids de etiqueta). El responsable mueve a "revision"; quien pidió aprueba
// ("listo") o devuelve ("cambios" = 1 revisión).
export const ESTADOS_PRODUCCION = [
  { id: "por_hacer", label: "Por hacer", color: "grey" },
  { id: "proceso", label: "En proceso", color: "orange" },
  { id: "revision", label: "En revisión", color: "blue" },
  { id: "cambios", label: "Cambios", color: "red" },
  { id: "listo", label: "Listo", color: "green", esDone: true },
] as const;

export const GRUPOS_PRODUCCION = ["Diseño", "Video", "Copy / Contenido", "Web / Funnels", "Estrategias"] as const;

export interface TareaProduccion {
  id: string;
  createdAt: string;
  responsables: string[];
  pidio: string[];
  estado: string | null; // estado actual
  fechaLimite: string | null;
}

export interface CambioEstado {
  itemId: string;
  estado: string | null;
  userId: string | null;
  at: string;
}

export const VENTANA_DIAS = 7;

function estadoEn(t: TareaProduccion, cambios: CambioEstado[], hastaMs: number): string | null {
  if (Date.parse(t.createdAt) > hastaMs) return null; // no existía
  let e: string | null | undefined;
  for (const c of cambios) if (Date.parse(c.at) <= hastaMs) e = c.estado;
  if (e !== undefined) return e;
  return cambios.length ? "por_hacer" : t.estado ?? "por_hacer";
}

export interface KpisProduccion {
  asignadas: number; // abiertas + terminadas en la ventana
  terminadas: number;
  entregas: number;
  entregasATiempo: number;
  revisiones: number;
  vencidas: number;
  backlog: number;
  vencidasPedidas: number; // para el PM: lo que pidió y está vencido
  autoaprobadas: number; // el mismo responsable la marcó Listo (se muestra, no se cuenta distinto)
}

/** KPIs de Producción de una persona al cierre de `fecha` (ventana móvil de 7 días). */
export function kpisProduccion(p: { userId: string; fecha: string; tareas: TareaProduccion[]; cambios: CambioEstado[] }): KpisProduccion {
  const fin = finDiaPR(p.fecha);
  const ini = finDiaPR(sumarDias(p.fecha, -VENTANA_DIAS));
  const porItem = new Map<string, CambioEstado[]>();
  for (const c of [...p.cambios].sort((a, b) => a.at.localeCompare(b.at))) {
    if (!porItem.has(c.itemId)) porItem.set(c.itemId, []);
    porItem.get(c.itemId)!.push(c);
  }
  const r: KpisProduccion = { asignadas: 0, terminadas: 0, entregas: 0, entregasATiempo: 0, revisiones: 0, vencidas: 0, backlog: 0, vencidasPedidas: 0, autoaprobadas: 0 };
  for (const t of p.tareas) {
    const cs = porItem.get(t.id) ?? [];
    const estado = estadoEn(t, cs, fin);
    if (estado === null) continue;
    const abierta = estado !== "listo";
    const vencida = abierta && !!t.fechaLimite && t.fechaLimite < p.fecha;
    if (t.pidio.includes(p.userId) && vencida) r.vencidasPedidas++;
    if (!t.responsables.includes(p.userId)) continue;

    const entrega = cs.find((c) => c.estado === "revision" || c.estado === "listo");
    const listo = cs.find((c) => c.estado === "listo");
    const enVentana = (c?: CambioEstado) => !!c && Date.parse(c.at) > ini && Date.parse(c.at) <= fin;
    if (abierta) {
      r.backlog++;
      if (vencida) r.vencidas++;
    }
    if (enVentana(listo)) {
      r.terminadas++;
      if (listo!.userId && t.responsables.includes(listo!.userId) && !t.pidio.includes(listo!.userId)) r.autoaprobadas++;
    }
    if (enVentana(entrega)) {
      r.entregas++;
      if (!t.fechaLimite || fechaPR(Date.parse(entrega!.at)) <= t.fechaLimite) r.entregasATiempo++;
    }
    r.revisiones += cs.filter((c) => c.estado === "cambios" && enVentana(c)).length;
    if (abierta || enVentana(listo)) r.asignadas++;
  }
  return r;
}

/** Valores por KPI (los que salen de Producción) para el puesto. */
export function valoresProduccion(k: KpisProduccion): Record<string, number | null> {
  return {
    entregas_a_tiempo: k.entregas ? Math.round((k.entregasATiempo / k.entregas) * 100) : null,
    terminadas: k.terminadas,
    revisiones: k.entregas ? Math.round((k.revisiones / k.entregas) * 100) / 100 : k.revisiones ? k.revisiones : null,
    vencidas: k.vencidas,
    backlog: k.backlog,
    entregables_vencidos: k.vencidasPedidas,
  };
}

// ─── Score ────────────────────────────────────────────────────────────────────────────────────

export const PESO_ASISTENCIA = 0.2;

/** 0-100 de un KPI contra su meta. null si no se midió o no puntúa. */
export function puntajeKpi(valor: number | null | undefined, k: Pick<Kpi, "meta" | "sentido">): number | null {
  if (valor === null || valor === undefined || Number.isNaN(valor) || k.sentido === "info") return null;
  if (k.sentido === "mayor") return k.meta <= 0 ? 100 : Math.round(Math.min(1, Math.max(0, valor) / k.meta) * 100);
  if (valor <= k.meta) return 100;
  return Math.round(((k.meta + 1) / (valor + 1)) * 100); // meta 0: 1 → 50, 2 → 33…
}

export interface DetalleKpi {
  kpi: Kpi;
  valor: number | null;
  puntaje: number | null;
  conectado: boolean;
}

export interface ScoreDia {
  score: number | null;
  asistencia: number | null;
  kpis: DetalleKpi[];
  parcial: boolean; // no hubo ningún KPI medido: el score es solo asistencia
}

export function scoreDia(p: { asistencia: number | null; kpis: Kpi[]; valores: Record<string, number | null> }): ScoreDia {
  const kpis: DetalleKpi[] = p.kpis.map((kpi) => {
    const conectado = FUENTES_CONECTADAS.includes(kpi.fuente);
    const valor = conectado ? p.valores[kpi.id] ?? null : null;
    return { kpi, valor, puntaje: kpi.peso > 0 ? puntajeKpi(valor, kpi) : null, conectado };
  });
  const medidos = kpis.filter((d) => d.puntaje !== null);
  const pesos = medidos.reduce((s, d) => s + d.kpi.peso, 0);
  const kpiProm = pesos ? medidos.reduce((s, d) => s + d.puntaje! * d.kpi.peso, 0) / pesos : null;
  let score: number | null;
  if (p.asistencia === null) score = null; // día libre: no se califica
  else if (kpiProm === null) score = p.asistencia;
  else score = PESO_ASISTENCIA * p.asistencia + (1 - PESO_ASISTENCIA) * kpiProm;
  return { score: score === null ? null : Math.round(score), asistencia: p.asistencia, kpis, parcial: kpiProm === null };
}

export type Color = "verde" | "amarillo" | "rojo";

export function colorScore(score: number | null): Color | null {
  if (score === null) return null;
  if (score >= 90) return "verde";
  if (score >= 75) return "amarillo";
  return "rojo";
}

export function promedio(xs: (number | null)[]): number | null {
  const v = xs.filter((x): x is number => x !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}

// ─── Permisos ─────────────────────────────────────────────────────────────────────────────────

export interface Actor {
  id: string;
  rol: "admin" | "editor" | "miembro";
  rrhh?: boolean; // Recursos Humanos (RITMO_RRHH): entra a la vista maestra aunque sea miembro en Pulse
}

// La vista maestra (todo el equipo, fichas y Ajustes) es de admin y editoras (Elvin, Carilin, Aure) y
// de Recursos Humanos (Yaileen, por RITMO_RRHH). Cada persona ve únicamente lo suyo.
export const esMaestro = (actor: Pick<Actor, "rol" | "rrhh">) => actor.rol === "admin" || actor.rol === "editor" || !!actor.rrhh;

export function puedeVer(actor: Actor, persona: { userId: string; liderId: string | null }): boolean {
  return esMaestro(actor) || persona.userId === actor.id;
}

/** Confirmar correcciones de ponche: solo la vista maestra, y nunca las propias. */
export function puedeAprobar(actor: Actor, persona: { userId: string; liderId: string | null }): boolean {
  return persona.userId !== actor.id && esMaestro(actor);
}

/**
 * KPIs obligatorios al marcar la salida (Elvin, 29/sep: "que no los deje ponchar si no han completado su KPI al final del
 * día"). Cada KPI del puesto necesita un número (0 vale, pero hay que escribirlo) y, si es > 0 y pide detalle, el detalle.
 * Lo que ya se reportó en una salida anterior de hoy cuenta. Devuelve lo que falta, en palabras; vacío = puede salir.
 */
export function faltanEnSalida(
  manual: { id: string; nombre: string; detalle?: string }[],
  envio: { datos: Record<string, number>; detalles: Record<string, string> },
  previo: { datos?: Record<string, number> | null; detalles?: Record<string, string> | null } | null,
): string[] {
  const falta: string[] = [];
  for (const m of manual) {
    const ahora = envio.datos[m.id];
    const antes = previo?.datos?.[m.id];
    if (ahora === undefined && antes === undefined) {
      falta.push(m.nombre);
      continue;
    }
    if (m.detalle && (ahora ?? 0) > 0 && !envio.detalles[m.id]?.trim()) falta.push(`${m.nombre}: ${m.detalle.replace(/[¿?]/g, "").trim().toLowerCase()}`);
  }
  return falta;
}

/** Validación del reporte del día de un puesto "solo reporte" (Lis): todos los KPIs con número (0 vale), el detalle si es
 *  > 0, y topes (montos en US$ hasta 1,000,000; lo demás hasta 500). Devuelve el error o null. */
export function errorReporteDia(manual: { id: string; nombre: string; detalle?: string; dinero?: boolean }[], datos: Record<string, number>, detalles: Record<string, string>): string | null {
  for (const m of manual) {
    const v = datos[m.id];
    if (v === undefined || !Number.isFinite(v)) return `Falta: ${m.nombre} (si fue 0, pon 0)`;
    if (v < 0 || v > (m.dinero ? 1_000_000 : 500)) return `Revisa el número de ${m.nombre}`;
    if (m.detalle && v > 0 && !detalles[m.id]?.trim()) return `${m.nombre}: ${m.detalle.replace(/[¿?]/g, "").trim().toLowerCase()}`;
  }
  return null;
}
