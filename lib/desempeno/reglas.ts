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
  manual?: { id: string; nombre: string }[]; // lo que reporta al marcar salida (además de bloqueos)
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

export const PUESTOS: Puesto[] = [
  {
    id: "pm",
    nombre: "Project / Account Manager",
    departamento: "Cuentas",
    manual: reuniones,
    kpis: [
      { id: "clientes_al_dia", nombre: "Clientes al día", fuente: "pulse", sentido: "mayor", meta: 95, peso: 3, unidad: "%" },
      { id: "pendientes", nombre: "Pendientes", fuente: "pulse", sentido: "menor", meta: 5, peso: 1, unidad: "u" },
      { id: "entregables_vencidos", nombre: "Entregables vencidos", fuente: "produccion", sentido: "menor", meta: 0, peso: 3, unidad: "u", ayuda: "Tareas que pidió en Producción y están vencidas" },
      { id: "escalaciones", nombre: "Escalaciones", fuente: "pulse", sentido: "menor", meta: 0, peso: 1, unidad: "u" },
      { id: "tiempo_respuesta", nombre: "Tiempo de respuesta", fuente: "slack", sentido: "menor", meta: 60, peso: 2, unidad: "min" },
    ],
  },
  {
    id: "estratega",
    nombre: "Estratega",
    departamento: "Estrategia y tráfico",
    manual: reuniones,
    kpis: [
      { id: "cuentas_revisadas", nombre: "Cuentas revisadas", fuente: "n8n", sentido: "mayor", meta: 100, peso: 2, unidad: "%" },
      { id: "entregas_a_tiempo", nombre: "Estrategias a tiempo", fuente: "produccion", sentido: "mayor", meta: 90, peso: 2, unidad: "%" },
      { id: "optimizaciones", nombre: "Optimizaciones", fuente: "meta", sentido: "mayor", meta: 10, peso: 2, unidad: "u" },
      { id: "cuentas_fuera_kpi", nombre: "Cuentas fuera de KPI", fuente: "n8n", sentido: "menor", meta: 2, peso: 2, unidad: "u" },
      { id: "reportes_a_tiempo", nombre: "Reportes a tiempo", fuente: "nocodb", sentido: "mayor", meta: 100, peso: 2, unidad: "%" },
    ],
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
  { id: "disenador", nombre: "Diseñador", departamento: "Producción", kpis: kpisTablero(15) },
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
];

export const DEPARTAMENTOS = [...new Set(PUESTOS.map((p) => p.departamento))];
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
}

// La vista maestra (todo el equipo + Ajustes) es solo de admin y editoras: hoy Elvin, Carilin y Aure
// (Elvin, 25/sep/2026). Cada persona ve únicamente lo suyo; el campo `lider` es informativo.
export const esMaestro = (actor: Pick<Actor, "rol">) => actor.rol === "admin" || actor.rol === "editor";

export function puedeVer(actor: Actor, persona: { userId: string; liderId: string | null }): boolean {
  return esMaestro(actor) || persona.userId === actor.id;
}

/** Confirmar correcciones de ponche: solo la vista maestra, y nunca las propias. */
export function puedeAprobar(actor: Actor, persona: { userId: string; liderId: string | null }): boolean {
  return persona.userId !== actor.id && esMaestro(actor);
}
