// Equipo digital (puro, sin DB; tests en tests/agentes-ia.test.mjs).
// Los agentes de IA reportan su día en Ritmo y se comparan con el puesto humano equivalente.
// Solo lo ven Elvin, Carilin y Aure: es para decidir, no para el equipo.

export type AgenteIA = { id: string; nombre: string; rol: string; comparaCon: string; donde: string; sinCosto?: boolean }; // sinCosto: su gasto de IA no se mide todavía

// comparaCon = id de puesto en PUESTOS (lib/desempeno/reglas.ts).
export const AGENTES_IA: AgenteIA[] = [
  { id: "sofi", nombre: "Sofi", rol: "Coordinadora de producción", comparaCon: "pm", donde: "Telegram · Railway" },
  { id: "nico", nombre: "Nico", rol: "Vibecoder / soporte técnico", comparaCon: "web", donde: "Telegram + Slack · Railway" },
  { id: "max", nombre: "Max", rol: "Estratega digital y media buyer", comparaCon: "media_buyer", donde: "Telegram + Slack · Railway" },
  { id: "lola", nombre: "Lola", rol: "Creadora de contenido con IA", comparaCon: "disenador", donde: "Telegram · Railway" },
  { id: "iris", nombre: "Iris", rol: "Vigía de edición (Cortex)", comparaCon: "soporte", donde: "Tarea programada", sinCosto: true },
  { id: "leo", nombre: "Leo", rol: "Director creativo (revisiones)", comparaCon: "copy", donde: "Slack", sinCosto: true },
];
export const agenteIA = (id: string) => AGENTES_IA.find((a) => a.id === id);

// Días laborables promedio por mes (22 días hábiles × 12 / 12 ≈ 21.7) para pasar salario mensual a costo por día.
export const DIAS_HABILES_MES = 21.7;

export type ReporteAgente = { agente: string; fecha: string; tareas: number | null; corridas: number; minutos: number; costoUsd: number };
export type DiaHumano = { horas: number; tareas: number | null };
// tareasVentana: tareas terminadas en toda la ventana (tablero Producción), cuando no hay dato por día.
export type Humano = { dias: DiaHumano[]; salarioMensual: number | null; tareasVentana?: number | null };

export type LadoComparado = {
  diasActivos: number;
  tareasDia: number | null; // promedio por día activo
  horasDia: number | null;
  costoDia: number | null; // US$
  costoPorTarea: number | null;
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const prom = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Un agente en la ventana: solo cuentan los días con actividad (corridas > 0 o tareas reportadas). */
export function ladoAgente(reportes: ReporteAgente[], opts: { sinMedicion?: boolean } = {}): LadoComparado & { totales: { tareas: number | null; horas: number | null; costo: number | null } } {
  const activos = reportes.filter((r) => r.corridas > 0 || (r.tareas ?? 0) > 0);
  const conTareas = activos.filter((r) => r.tareas !== null);
  const tareas = conTareas.reduce((n, r) => n + r.tareas!, 0);
  const costoTotal = activos.reduce((n, r) => n + r.costoUsd, 0);
  // Costo por tarea = lo que costaron los días en que reportó tareas ÷ esas tareas (28/sep: antes dividía
  // promedios de días distintos y no cuadraba con las tarjetas de arriba).
  const costoConTareas = conTareas.reduce((n, r) => n + r.costoUsd, 0);
  const medido = !opts.sinMedicion; // Leo e Iris: su tiempo y su costo de IA todavía no se miden
  return {
    diasActivos: activos.length,
    tareasDia: conTareas.length ? r2(tareas / conTareas.length) : null,
    horasDia: medido && activos.length ? r2(prom(activos.map((r) => r.minutos / 60))!) : null,
    costoDia: medido && activos.length ? r2(costoTotal / activos.length) : null,
    costoPorTarea: medido && tareas > 0 ? r2(costoConTareas / tareas) : null,
    totales: { tareas: conTareas.length ? tareas : null, horas: medido && activos.length ? r2(activos.reduce((n, r) => n + r.minutos, 0) / 60) : null, costo: medido && activos.length ? r2(costoTotal) : null },
  };
}

/** Los humanos de un puesto: promedio por persona y por día trabajado (horas > 0). */
export function ladoHumano(personas: Humano[]): LadoComparado & { personas: number } {
  const dias = personas.flatMap((p) => p.dias.filter((d) => d.horas > 0));
  const conTareas = dias.filter((d) => d.tareas !== null);
  const salarios = personas.map((p) => p.salarioMensual).filter((s): s is number => s !== null && s > 0);
  // Tareas de la ventana completa (Producción): total ÷ días trabajados de esas mismas personas.
  const conVentana = personas.filter((p) => p.tareasVentana !== undefined && p.tareasVentana !== null);
  const diasVentana = conVentana.reduce((n, p) => n + p.dias.filter((d) => d.horas > 0).length, 0);
  const tareasDia = conTareas.length
    ? prom(conTareas.map((d) => d.tareas!))
    : diasVentana
      ? conVentana.reduce((n, p) => n + (p.tareasVentana ?? 0), 0) / diasVentana
      : null;
  const costoDia = salarios.length ? prom(salarios)! / DIAS_HABILES_MES : null;
  return {
    personas: personas.length,
    diasActivos: dias.length,
    tareasDia: tareasDia === null ? null : r2(tareasDia),
    horasDia: dias.length ? r2(prom(dias.map((d) => d.horas))!) : null,
    costoDia: costoDia === null ? null : r2(costoDia),
    costoPorTarea: tareasDia && costoDia !== null ? r2(costoDia / tareasDia) : null,
  };
}

/** Cuántas veces más (o menos) produce/cuesta el agente vs el humano. null si falta un lado. */
export function veces(agente: number | null, humano: number | null): number | null {
  if (agente === null || humano === null || humano === 0) return null;
  return Math.round((agente / humano) * 10) / 10;
}

/** Normaliza lo que manda un agente (API): textos cortos, números sanos, hasta 12 entregables. */
export function limpiarReporte(b: { resumen?: unknown; tareas?: unknown; entregables?: unknown; bloqueos?: unknown }) {
  const txt = (x: unknown, n: number) => (typeof x === "string" && x.trim() ? x.trim().slice(0, n) : null);
  const t = Number(b.tareas);
  const ent = Array.isArray(b.entregables) ? b.entregables : typeof b.entregables === "string" ? b.entregables.split("|") : [];
  return {
    resumen: txt(b.resumen, 3000),
    tareas: b.tareas === undefined || b.tareas === null || b.tareas === "" || !Number.isFinite(t) ? null : Math.max(0, Math.min(500, Math.round(t))),
    entregables: ent.map((e) => String(e).trim().slice(0, 300)).filter(Boolean).slice(0, 12),
    bloqueos: txt(b.bloqueos, 1000),
  };
}
